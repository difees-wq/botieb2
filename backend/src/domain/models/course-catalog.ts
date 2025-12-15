import { TipoEstudio } from "../enums";

export interface CourseCatalogItem {
	slugUrl: string;
	nombre: string;
	tipoEstudio: TipoEstudio;
	urlFicha: string;
}

