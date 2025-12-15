import fs from "fs";
import path from "path";
import { TipoEstudio } from "../domain/enums";
import { CourseCatalogDbRepository, DbCourseRow, DbCourseOfferingRow } from "../repositories/course-catalog-db-repository";

// Estructura cruda del JSON (sin derivar tipoEstudio aquí según restricción de cambios mínimos)
export interface CursoIEB {
  slug: string;
  nombre: string;
  nivel: string; // GRADO | POSGRADO | ONLINE
  familia: string;
  categoriaFlujo: string; // GRADO | MASTER_PRESENCIAL | MASTER_ONLINE | CURSOS_ONLINE | CURSOS_VERANO
}

// Interfaces públicas nuevas para consumo de cursos y ofertas desde BD
export interface CatalogCourse {
  sfId: string;
  name: string;
  type: string | null;
  description: string | null;
  url: string | null;
  active: boolean;
  tipoDeEstudio1?: string | null;
  tipoDeEstudio2?: string | null;
  updatedAt: string | null;
}

export interface CatalogCourseOffering {
  sfId: string;
  courseSfId: string;
  startDate: string | null;
  endDate: string | null;
  price: number | null;
  updatedAt: string | null;
}

export class CourseCatalogService {
  private cache: CursoIEB[] | null = null;
  // Cache ligera de cursos activos para evitar repetidas consultas (invalidation manual futura)
  private activeCoursesCache: CatalogCourse[] | null = null;

  constructor(private readonly repository?: CourseCatalogDbRepository) {}

  private load(): CursoIEB[] {
    if (this.cache) return this.cache;
    // Se intenta primero con nombre indicado por el usuario; fallback al existente sin extensión.
    const candidatePaths = [
      path.resolve(process.cwd(), "backend/src/config/IEB-estudios.json"),
      path.resolve(process.cwd(), "backend/src/config/IEB-estudios")
    ];
    let filePath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) { filePath = p; break; }
    }
    if (!filePath) {
      this.cache = [];
      return this.cache;
    }
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(raw) as CursoIEB[];
      this.cache = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("[CourseCatalogService] Error cargando catálogo:", e);
      this.cache = [];
    }
    return this.cache;
  }

  getAll(): CursoIEB[] {
    return this.load();
  }

  getByCategoriaFlujo(categoriaFlujo: string): CursoIEB[] {
    return this.load().filter(c => c.categoriaFlujo === categoriaFlujo);
  }

  getBySlug(slug: string): CursoIEB | undefined {
    return this.load().find(c => c.slug === slug);
  }

  private deriveTipoEstudio(categoriaFlujo: string): TipoEstudio {
    if (categoriaFlujo.startsWith("MASTER")) return TipoEstudio.MASTER;
    if (categoriaFlujo.includes("ONLINE")) return TipoEstudio.ONLINE;
    if (categoriaFlujo === "GRADO") return TipoEstudio.GRADO;
    return TipoEstudio.DESCONOCIDO;
  }

  getInfoBySlug(slug: string): { nombre: string; tipoEstudio: TipoEstudio } | null {
    const curso = this.getBySlug(slug);
    if (!curso) return null;
    return { nombre: curso.nombre, tipoEstudio: this.deriveTipoEstudio(curso.categoriaFlujo) };
  }

  // ======================= NUEVAS FUNCIONES BD ==========================
  /**
   * Obtiene cursos activos desde la base de datos. Usa cache simple en memoria.
   */
  async getActiveCourses(): Promise<CatalogCourse[]> {
    if (!this.repository) return []; // Sin repositorio no hay BD
    if (this.activeCoursesCache) return this.activeCoursesCache;
    const rows = await this.repository.getActiveCourses();
    const mapped = rows.map(r => this.mapCourseRow(r));
    this.activeCoursesCache = mapped;
    return mapped;
  }

  /**
   * Obtiene los offerings de un curso usando su Salesforce Id.
   */
  async getCourseOfferings(courseSfId: string): Promise<CatalogCourseOffering[]> {
    if (!this.repository) return [];
    const rows = await this.repository.getOfferingsByCourseSfId(courseSfId);
    return rows.map(r => this.mapOfferingRow(r));
  }

  /**
   * Busca cursos por año (derivado del start_date de sus offerings).
   */
  async searchCoursesByYear(year: number): Promise<CatalogCourse[]> {
    if (!this.repository) return [];
    const rows = await this.repository.searchCoursesByYear(year);
    return rows.map(r => this.mapCourseRow(r));
  }

  // ======================= MAPEO INTERNO ================================
  private mapCourseRow(r: DbCourseRow): CatalogCourse {
    return {
      sfId: r.sf_id,
      name: r.name,
      type: r.type,
      description: r.description,
      url: r.url,
      active: r.active,
      tipoDeEstudio1: (r as any).tipo_de_estudio1 ?? null,
      tipoDeEstudio2: (r as any).tipo_de_estudio2 ?? null,
      updatedAt: r.updated_at
    };
  }

  private mapOfferingRow(r: DbCourseOfferingRow): CatalogCourseOffering {
    return {
      sfId: r.sf_id,
      courseSfId: r.course_sf_id,
      startDate: r.start_date,
      endDate: r.end_date,
      price: r.price == null ? null : Number(r.price),
      updatedAt: r.updated_at
    };
  }
}
