

import { CourseCatalogItem } from "../domain/models/course-catalog";
import { TipoEstudio } from "../domain/enums";

export class UrlContextService {
constructor(private readonly catalog: CourseCatalogItem[]) {}

resolve(url: string): {
tipoEstudio: TipoEstudio;
cursoSlug: string | null;
cursoNombre: string | null;
cursoUrlFicha: string | null;
} {
const clean = url.toLowerCase().trim();

const match = this.catalog.find(c =>
  clean.includes(c.slugUrl.toLowerCase())
);

if (!match) {
  return {
    tipoEstudio: TipoEstudio.DESCONOCIDO,
    cursoSlug: null,
    cursoNombre: null,
    cursoUrlFicha: null
  };
}

return {
  tipoEstudio: match.tipoEstudio,
  cursoSlug: match.slugUrl,
  cursoNombre: match.nombre,
  cursoUrlFicha: match.urlFicha
};


}
}
