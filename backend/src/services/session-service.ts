import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";
import { ConversationState } from "../domain/models/chat-flow.js";
import { NotFoundError, DatabaseError } from "../domain/errors.js";

export interface SessionServiceApi {
  createOrGetSession(visitorHash: string, urlOrigen: string): Promise<ChatSession>;
  getSession(sessionId: string): Promise<ChatSession | null>;
  updateSession(sessionId: string, state: ConversationState, currentNodeId: string): Promise<void>;
}

export interface ChatSession {
  sessionId: string;
  visitorHash: string;
  urlOrigen: string;
  state: any;
  currentNodeId: string;
  createdAt: Date;
  updatedAt: Date;
  lastInteractionAt: Date | null;
}

export class SessionService implements SessionServiceApi {
  constructor(private readonly db: Pool) {}

  async createOrGetSession(visitorHash: string, urlOrigen: string): Promise<ChatSession> {
    // Try to find existing by visitante_hash + url_origen
    const existing = await this.db.query(
      `SELECT * FROM chat_session WHERE visitante_hash = $1 AND url_origen = $2 ORDER BY created_at ASC LIMIT 1`,
      [visitorHash, urlOrigen]
    );
    if (existing.rowCount && existing.rows[0]) {
      // Touch last_interaction_at
      const updated = await this.db.query(
        `UPDATE chat_session SET last_interaction_at = NOW() WHERE id_sesion = $1 RETURNING *`,
        [existing.rows[0].id_sesion]
      );
      return this.mapRow(updated.rows[0]);
    }
    const newId = uuidv4();
    const insert = await this.db.query(
      `INSERT INTO chat_session (id_sesion, visitante_hash, url_origen, state, current_node_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
       RETURNING *`,
      [newId, visitorHash, urlOrigen, JSON.stringify({}), "N1"]
    );
    return this.mapRow(insert.rows[0]);
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
  const r = await this.db.query(`SELECT * FROM chat_session WHERE id_sesion = $1`, [sessionId]);
    if (r.rowCount === 0) return null;
    return this.mapRow(r.rows[0]);
  }

  async updateSession(sessionId: string, state: ConversationState, currentNodeId: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE chat_session
         SET state = $2, current_node_id = $3, last_interaction_at = NOW(), updated_at = NOW()
         WHERE id_sesion = $1`,
        [sessionId, JSON.stringify(state), currentNodeId]
      );
    } catch (err: any) {
      throw new DatabaseError("DB_UPDATE_CHAT_SESSION", err.message);
    }
  }

  private mapRow(row: any): ChatSession {
    return {
      sessionId: row.id_sesion,
      visitorHash: row.visitante_hash,
      urlOrigen: row.url_origen,
      state: row.state,
      currentNodeId: row.current_node_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastInteractionAt: row.last_interaction_at ?? null
    };
  }
}
