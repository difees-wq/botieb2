import { Pool } from "pg";
import { ChatSession } from "../domain/models/chat-session";
import { DatabaseError } from "../domain/errors";

export class ChatSessionRepository {
  constructor(private readonly db: Pool) {}

  /** Legacy-style create used by current SessionService */
  async create(data: {
    idSesion: string;
    visitanteHash: string;
    urlOrigen: string;
    tipoEstudio: string;
    cursoSlug: string | null;
    estadoFlujo: string;
    leadSfId: string | null;
  }): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO chat_session (
            id_sesion,
            visitante_hash,
            url_origen,
            tipo_estudio,
            curso_slug,
            estado_flujo,
            lead_sf_id,
            created_at,
            updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW());`,
        [
          data.idSesion,
          data.visitanteHash,
          data.urlOrigen,
          data.tipoEstudio,
          data.cursoSlug,
          data.estadoFlujo,
          data.leadSfId
        ]
      );
    } catch (err: any) {
      throw new DatabaseError("DB_CREATE_SESSION", err.message);
    }
  }

  /** Newer minimal createSession (kept for potential future use) */
  async createSession(session: ChatSession): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO chat_session (
            id_sesion,
            visitante_hash,
            url_origen,
            tipo_estudio,
            curso_slug,
            estado_flujo,
            lead_sf_id,
            created_at,
            updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW());`,
        [
          session.idSesion,
          session.visitanteHash,
          session.urlOrigen,
          session.tipoEstudio,
          session.cursoSlug,
          session.estadoFlujo,
          session.leadSfId
        ]
      );
    } catch (err: any) {
      throw new DatabaseError("DB_CREATE_SESSION_MODERN", err.message);
    }
  }

  async updateFlowState(idSesion: string, estadoFlujo: string, leadSfId: string | null): Promise<void> {
    try {
      await this.db.query(
        `UPDATE chat_session SET estado_flujo=$2, lead_sf_id=$3, updated_at=NOW() WHERE id_sesion=$1;`,
        [idSesion, estadoFlujo, leadSfId]
      );
    } catch (err: any) {
      throw new DatabaseError("DB_UPDATE_FLOW_STATE", err.message);
    }
  }

  // Compatibility wrapper for previous naming
  async updateState(idSesion: string, newState: string): Promise<void> {
    return this.updateFlowState(idSesion, newState, null);
  }

  async findById(idSesion: string): Promise<ChatSession | null> {
    try {
      const r = await this.db.query(
        `SELECT * FROM chat_session WHERE id_sesion = $1`,
        [idSesion]
      );
      if (r.rowCount === 0) return null;
      const row = r.rows[0];
      return {
        idSesion: row.id_sesion,
        visitanteHash: row.visitante_hash,
        urlOrigen: row.url_origen,
        tipoEstudio: row.tipo_estudio,
        cursoSlug: row.curso_slug,
        estadoFlujo: row.estado_flujo,
        leadSfId: row.lead_sf_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (err: any) {
      throw new DatabaseError("DB_FIND_SESSION", err.message);
    }
  }
}
