import { Pool } from "pg";
import { getDbPool } from "../config/db-connection.js";
import { v4 as uuidv4 } from "uuid";

// Re-definimos interfaces mínimas para evitar dependencia circular con el servicio que usa otras estructuras.
export interface CourseUpsertInput {
  id: string; // Salesforce Id (externo)
  name: string;
  type: string;
  description: string;
  url: string;
  active: boolean;
  tipo_de_estudio1: string;
  tipo_de_estudio2: string;
}

export interface CourseOfferingUpsertInput {
  id: string; // Salesforce offering Id
  courseId: string; // Salesforce course Id (para FK por sf_id)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  price: number;
}

export interface UpsertResultSummary {
  inserted: number;
  updated: number;
}

// Shapes para lectura desde la base de datos
export interface DbCourseRow {
  sf_id: string;
  name: string;
  type: string | null;
  description: string | null;
  url: string | null;
  active: boolean;
  tipo_de_estudio1: string | null;
  tipo_de_estudio2: string | null;
  updated_at: string | null; // timestamp
}

export interface DbCourseOfferingRow {
  sf_id: string;
  course_sf_id: string;
  start_date: string | null; // date
  end_date: string | null; // date
  price: string | null; // numeric -> string from pg driver
  updated_at: string | null;
}

/**
 * CourseCatalogDbRepository
 * -----------------------------------------
 * Persists and queries course data (Courses + Offerings) in Supabase.
 *
 * CURRENT STATE: Skeleton only. No real DB interactions yet.
 *
 * DESIGN NOTES / TODOs:
 * - Inject a Supabase client (or an abstraction) in the constructor.
 * - Decide transactional strategy for bulk upserts (courses + offerings).
 * - Add pagination & filtering (status, modality, category) when needed.
 * - Implement caching / invalidation strategy if read volume is high.
 * - Consider separating read vs write repositories if complexity grows.
 */
export class CourseCatalogDbRepository {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool || getDbPool();
  }

  /**
   * Upsert de cursos por sf_id (Salesforce Id). Si ya existe, actualiza.
   * Retorna resumen de cuántos fueron insertados vs actualizados.
   */
  async upsertCourses(courses: CourseUpsertInput[]): Promise<UpsertResultSummary> {
    if (!courses.length) return { inserted: 0, updated: 0 };

    const client = this.pool;
    let inserted = 0;
    let updated = 0;

    // Estrategia simple: iterar. Optimizable con COPY / VALUES + ON CONFLICT masivo.
    for (const c of courses) {
      // Normaliza valores
      const sfId = c.id;
      const name = c.name ?? "";
      const type = c.type ?? "";
      const description = c.description ?? "";
      const url = c.url ?? "";
      const active = c.active ?? true;

  const tipoDeEstudio1 = c.tipo_de_estudio1 ?? "";
  const tipoDeEstudio2 = c.tipo_de_estudio2 ?? "";

      const query = `
        INSERT INTO public.courses (id, sf_id, name, type, description, url, active, tipo_de_estudio1, tipo_de_estudio2, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, timezone('utc', now()))
        ON CONFLICT (sf_id) DO UPDATE
          SET name = EXCLUDED.name,
              type = EXCLUDED.type,
              description = EXCLUDED.description,
              url = EXCLUDED.url,
              active = EXCLUDED.active,
              tipo_de_estudio1 = EXCLUDED.tipo_de_estudio1,
              tipo_de_estudio2 = EXCLUDED.tipo_de_estudio2,
              updated_at = timezone('utc', now())
        RETURNING (xmax = 0) AS inserted_flag;`;

      const params = [uuidv4(), sfId, name, type, description, url, active, tipoDeEstudio1, tipoDeEstudio2];
      const res = await client.query(query, params);
      const row = res.rows[0];
      if (row && row.inserted_flag === true) {
        inserted += 1;
      } else {
        updated += 1;
      }
    }
    return { inserted, updated };
  }

  /**
   * Upsert de course_offerings por sf_id. Usa course_sf_id para la FK.
   */
  async upsertOfferings(offerings: CourseOfferingUpsertInput[]): Promise<UpsertResultSummary> {
    if (!offerings.length) return { inserted: 0, updated: 0 };
    const client = this.pool;
    let inserted = 0;
    let updated = 0;

    for (const o of offerings) {
      const sfId = o.id;
      const courseSfId = o.courseId;
      const startDate = o.startDate || null;
      const endDate = o.endDate || null;
      const price = isNaN(o.price) ? null : o.price;

      const query = `
        INSERT INTO public.course_offerings (id, sf_id, course_sf_id, start_date, end_date, price, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, timezone('utc', now()))
        ON CONFLICT (sf_id) DO UPDATE
          SET course_sf_id = EXCLUDED.course_sf_id,
              start_date = EXCLUDED.start_date,
              end_date = EXCLUDED.end_date,
              price = EXCLUDED.price,
              updated_at = timezone('utc', now())
        RETURNING (xmax = 0) AS inserted_flag;`;

      const params = [uuidv4(), sfId, courseSfId, startDate, endDate, price];
      const res = await client.query(query, params);
      const row = res.rows[0];
      if (row && row.inserted_flag === true) {
        inserted += 1;
      } else {
        updated += 1;
      }
    }
    return { inserted, updated };
  }

  /**
   * Obtiene cursos activos.
   */
  async getActiveCourses(): Promise<DbCourseRow[]> {
  const res = await this.pool.query("SELECT sf_id, name, type, description, url, active, tipo_de_estudio1, tipo_de_estudio2, updated_at FROM public.courses WHERE active = true ORDER BY name ASC");
    return res.rows as DbCourseRow[];
  }

  /**
   * Obtiene ofertas de un curso por su Salesforce Id.
   */
  async getOfferingsByCourseSfId(courseSfId: string): Promise<DbCourseOfferingRow[]> {
    const res = await this.pool.query(
      "SELECT sf_id, course_sf_id, start_date, end_date, price, updated_at FROM public.course_offerings WHERE course_sf_id = $1 ORDER BY start_date ASC",
      [courseSfId]
    );
    return res.rows as DbCourseOfferingRow[];
  }

  /**
   * Busca cursos por año basándose en el año de start_date de sus offerings.
   * Asunción: Se considera el año académico/comercial el del campo start_date.
   */
  async searchCoursesByYear(year: number): Promise<DbCourseRow[]> {
    const res = await this.pool.query(
      "SELECT DISTINCT c.sf_id, c.name, c.type, c.description, c.url, c.active, c.updated_at FROM public.courses c JOIN public.course_offerings o ON o.course_sf_id = c.sf_id WHERE EXTRACT(YEAR FROM o.start_date) = $1 ORDER BY c.name ASC",
      [year]
    );
    return res.rows as DbCourseRow[];
  }
}
