import { Pool } from 'pg';

export class DynamicQueryHandler {
  constructor(private readonly db: Pool) {}

  // Returns available years from course_offerings.start_date
  async getAvailableYears(state: any): Promise<Array<{ label: string; value: string }>> {
  const currentYear = new Date().getFullYear();

  const years = [
    currentYear,
    currentYear + 1,
    currentYear + 2
  ];

  return years.map(year => ({
    label: String(year),
    value: String(year)
  }));
}

  // Filters courses using type1, type2 and selectedYear, returns label/value pairs
  async getCoursesByFilters(state: any): Promise<Array<{ label: string; value: string }>> {
  const type1 = state?.type1 || null;
  const type2 = state?.type2 || null;
  // comentado filtro antiguo de AÑO: const year = state?.selectedYear || state?.year || null;

  const where: string[] = [];
  const params: any[] = [];

  if (type1) { params.push(type1); where.push(`c.tipo_de_estudio1 = $${params.length}`); }
  if (type2) { params.push(type2); where.push(`c.tipo_de_estudio2 = $${params.length}`); }

  
  // Siempre filtramos por cursos que tengan estudio de interés válido
where.push(`c.study_of_interest IS NOT NULL`);

const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

const sql = `
  SELECT DISTINCT 
    c.course_id AS id,
    c.sf_id AS sf_id,
    c.name AS name,
    c.study_of_interest AS study_of_interest
  FROM courses c
  ${whereSql}
  ORDER BY name ASC
`;



  const r = await this.db.query(sql, params);
  return r.rows.map((row: any) => ({ label: row.name, value: row.id, sf_id: row.sf_id, study_of_interest: row.study_of_interest}));
}
}
