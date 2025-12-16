import { SalesforceService } from "../integrations/salesforce-service.js";
import { IntegrationError, SalesforceError } from "../domain/errors.js";
import { CourseCatalogDbRepository, CourseUpsertInput, CourseOfferingUpsertInput } from "../repositories/course-catalog-db-repository.js";

/**
 * Interfaces requested for the sync output.
 * (Deliberately NOT importing skeleton domain models to avoid conflicts.)
 */
export interface Course {
  id: string;
  name: string;
  type: string;
  description: string;
  active: boolean;
  url: string;
  tipoDeEstudio1: string;
  tipoDeEstudio2: string;
}

export interface CourseOffering {
  id: string;
  courseId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  price: number;
}

interface RawFetchResult {
  coursesRaw: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  offeringsRaw: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export class SalesforceCatalogSyncService {
  constructor(
    private readonly salesforceService: SalesforceService,
    private readonly repository: CourseCatalogDbRepository
  ) {}

  /**
   * 1️⃣ fetchFromSalesforce
   * Usa SalesforceService con SOQL (aprovechando métodos existentes para simplificar).
   * Devuelve datos "raw" (en este contexto: salida directa de los métodos existentes).
   * - Si no hay cursos, retorna arrays vacíos inmediatamente.
   * - Maneja 401 con un único retry (los métodos internos ya lo hacen, pero añadimos salvaguarda).
   */
  async fetchFromSalesforce(): Promise<RawFetchResult> {
    let coursesRaw: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      coursesRaw = await this.salesforceService.getActiveCourses();
    } catch (e: any) {
      // Los métodos internos ya reintentan en 401; aquí sólo capturamos para logging.
      if (e instanceof IntegrationError && e.code === "SF_UNAUTHORIZED") {
        console.error("[salesforce-catalog-sync] Unauthorized fetching courses after retry", e);
      } else {
        console.error("[salesforce-catalog-sync] Error fetching courses", e);
      }
      // Si falla totalmente devolvemos vacío según el requisito.
      return { coursesRaw: [], offeringsRaw: [] };
    }

    if (!coursesRaw.length) {
      return { coursesRaw: [], offeringsRaw: [] };
    }

    // Obtener todas las ofertas. Podemos optimizar con un IN query, pero reutilizamos método existente ahora.
    const offeringsAggregate: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const c of coursesRaw) {
      const courseId = c.id || c.Id;
      if (!courseId) continue;
      try {
        const offeringList = await this.salesforceService.getOfferingsByCourse(courseId);
        offeringsAggregate.push(...offeringList);
      } catch (e: any) {
        if (e instanceof IntegrationError && e.code === "SF_UNAUTHORIZED") {
          console.error(`[salesforce-catalog-sync] Unauthorized fetching offerings for course ${courseId}`, e);
        } else {
          console.error(`[salesforce-catalog-sync] Error fetching offerings for course ${courseId}`, e);
        }
        // Continuar con el siguiente curso, acumulando las que sí se puedan.
      }
    }

    return { coursesRaw, offeringsRaw: offeringsAggregate };
  }

  /**
   * 2️⃣ transformSalesforceData
   * Mapea los arrays raw a Course[] y CourseOffering[] usando las interfaces pedidas.
   * - Convierte fechas a YYYY-MM-DD
   * - Convierte precio a number
   * - Usa Course_Type__c si existe; si no, intenta fallback a departamento.
   */
  transformSalesforceData(raw: RawFetchResult): { courses: Course[]; offerings: CourseOffering[] } {
    const toIsoDate = (value: any): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!value) return "";
      const str = String(value).trim();
      // Si ya parece YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
      const d = new Date(str);
      if (isNaN(d.getTime())) return ""; // fecha inválida
      return d.toISOString().slice(0, 10);
    };

    const courses: Course[] = raw.coursesRaw.map((c: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      return {
        id: String(c.id || c.Id || ""),
        name: String(c.name || c.Name || ""),
        type: String(c.Course_Type__c || c.courseType || c.departamento || ""),
        description: String(c.descripcion || c.hed__Description__c || ""),
        active: Boolean(c.activo ?? c.Activo__c ?? true),
        url: String(c.urlWeb || c.URL_Web__c || ""),
        tipoDeEstudio1: String(c.tipoDeEstudio1 || c.Tipo_de_estudio1__c || ""),
        tipoDeEstudio2: String(c.tipoDeEstudio2 || c.Tipo_de_estudio2__c || "")
      };
    }).filter(c => c.id);

    const offerings: CourseOffering[] = raw.offeringsRaw.map((o: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const priceRaw = o.price ?? o.Price__c;
      return {
        id: String(o.id || o.Id || ""),
        courseId: String(o.courseId || o.hed__Course__c || ""),
        startDate: toIsoDate(o.startDate || o.hed__Start_Date__c),
        endDate: toIsoDate(o.endDate || o.hed__End_Date__c),
        price: priceRaw == null || priceRaw === "" ? 0 : Number(priceRaw)
      };
    }).filter(o => o.id && o.courseId);

    return { courses, offerings };
  }

  /**
   * 3️⃣ runSync
   * Orquesta el flujo: fetch → transform → return.
   * NO persiste en Supabase (requisito).
   */
  async runSync(): Promise<{ courses: Course[]; offerings: CourseOffering[] }> {
    let raw: RawFetchResult;
    try {
      raw = await this.fetchFromSalesforce();
    } catch (e: any) {
      console.error("[salesforce-catalog-sync] Error inesperado en fetchFromSalesforce", e);
      if (e instanceof SalesforceError || e instanceof IntegrationError) {
        // En caso de error crítico devolvemos arrays vacíos según requerimiento de resiliencia.
        return { courses: [], offerings: [] };
      }
      return { courses: [], offerings: [] };
    }
    // Si no hay cursos, devolver arrays vacíos inmediatamente.
    if (!raw.coursesRaw.length) {
      return { courses: [], offerings: [] };
    }
    const transformed = this.transformSalesforceData(raw);

    // Persistencia: upsert en Supabase (courses y offerings). Sin modificar transformer.
    try {
      const courseUpserts: CourseUpsertInput[] = transformed.courses.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        description: c.description,
        url: c.url,
        active: c.active,
        tipo_de_estudio1: c.tipoDeEstudio1,
        tipo_de_estudio2: c.tipoDeEstudio2
      }));
      const offeringUpserts: CourseOfferingUpsertInput[] = transformed.offerings.map(o => ({
        id: o.id,
        courseId: o.courseId,
        startDate: o.startDate,
        endDate: o.endDate,
        price: o.price
      }));

      const courseResult = await this.repository.upsertCourses(courseUpserts);
      const offeringResult = await this.repository.upsertOfferings(offeringUpserts);
      console.log(`[salesforce-catalog-sync] Upsert courses => inserted:${courseResult.inserted} updated:${courseResult.updated}`);
      console.log(`[salesforce-catalog-sync] Upsert offerings => inserted:${offeringResult.inserted} updated:${offeringResult.updated}`);
    } catch (e: any) {
      console.error("[salesforce-catalog-sync] Error persistiendo catálogo en Supabase", e);
      // No lanzamos para no romper respuesta; se devuelven datos de todas formas.
    }
    return transformed;
  }
}
