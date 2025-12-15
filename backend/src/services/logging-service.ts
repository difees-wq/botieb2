
import { v4 as uuid } from "uuid";
import { MessageLogRepository } from "../repositories/message-log-repository";
import { EventLogRepository } from "../repositories/event-log-repository";

export class LoggingService {
	constructor(
		private readonly msgRepo: MessageLogRepository,
		private readonly evtRepo: EventLogRepository
	) {}

	async message(idSesion: string, actor: "USER" | "BOT", contenido: string) {
		await this.msgRepo.logMessage({
			idMensaje: uuid(),
			idSesion,
			actor,
			contenido
		});
	}

	async event(idSesion: string | null, tipo: string, payload: any) {
		// La tabla event_log espera (sessionId, eventType, payload)
		// Si no hay sesión (eventos globales), usamos un marcador fijo
		const sessionRef = idSesion || "NO_SESSION";
		await this.evtRepo.logEvent(sessionRef, tipo, {
			idEvento: uuid(),
			...payload
		});
	}
}
