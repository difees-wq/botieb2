import { Pool } from "pg";
import { DatabaseError } from "../domain/errors.js";

export class MessageLogRepository {
  constructor(private readonly db: Pool) {}

  async logMessage(params: {
    idMensaje: string;
    idSesion: string;
    actor: string;
    contenido: string;
  }): Promise<void> {
    try {
      await this.db.query(
        `
        INSERT INTO message_log (
          id_mensaje,
          id_sesion,
          tipo,
          contenido,
          created_at
        )
        VALUES ($1, $2, $3, $4, NOW());
        `,
        [params.idMensaje, params.idSesion, params.actor, params.contenido]
      );
    } catch (err: any) {
      throw new DatabaseError("DB_LOG_MESSAGE", err.message);
    }
  }
}
