import { AppConfig } from "../config/app-config";
import { CourseCatalogItem } from "../domain/models/course-catalog";
import { TipoEstudio } from "../domain/enums";

/**
 * Repositorio de catálogo de cursos.
 * 
 * En este MVP este catálogo se carga desde un archivo JSON,
 * pero en futuras versiones puede venir de Salesforce u otra API.
 */
export class CourseCatalogRepository {
  private cache: CourseCatalogItem[] | null = null;
  constructor(private readonly _config: AppConfig) {}

  /**
   * Devuelve la lista completa de cursos.
   * Carga el fichero JSON si no está en memoria.
   */
  async getCatalog(): Promise<CourseCatalogItem[]> {
    if (this.cache) return this.cache;
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.resolve(process.cwd(), "config/courses/catalog.json");
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw) as { courses: { slug: string; name: string; type: string; url: string }[] };
      const items: CourseCatalogItem[] = (parsed.courses || []).map(c => ({
        slugUrl: c.slug,
        nombre: c.name,
        tipoEstudio: (Object.values(TipoEstudio).includes(c.type as TipoEstudio) ? c.type : TipoEstudio.DESCONOCIDO) as TipoEstudio,
        urlFicha: c.url
      }));
      this.cache = items;
      return this.cache;
    } catch (err) {
      console.error("❌ ERROR leyendo catalog.json:", err);
      this.cache = [];
      return this.cache;
    }
  }

  /**
   * Busca un curso por ID
   */
  async getBySlug(slug: string): Promise<CourseCatalogItem | null> {
    const catalog = await this.getCatalog();
    return catalog.find(c => c.slugUrl === slug) ?? null;
  }

  /**
   * Busca cursos por categoría
   */
  async findByTipoEstudio(tipo: TipoEstudio): Promise<CourseCatalogItem[]> {
    const catalog = await this.getCatalog();
    return catalog.filter(c => c.tipoEstudio === tipo);
  }
}
