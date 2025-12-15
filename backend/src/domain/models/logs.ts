
export interface MessageLog {
idMensaje: string;
idSesion: string;
tipo: "USER" | "BOT";
contenido: string;
createdAt: string;
}

export interface EventLog {
idEvento: string;
idSesion: string | null;
tipoEvento: string;
payload: any;
createdAt: string;
}

