

export interface CreateSessionRequest {
visitanteHash: string;
urlOrigen: string;
}

export interface CreateSessionResult {
idSesion: string;
tipoEstudio: string;
cursoSlug: string | null;
cursoNombre: string | null;
cursoUrlFicha: string | null;
}

