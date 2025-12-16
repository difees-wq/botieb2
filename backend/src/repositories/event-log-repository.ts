import { Pool } from "pg";
import { DatabaseError } from "../domain/errors.js";

export class EventLogRepository {
  constructor(private readonly db: Pool) {}

  async logEvent(
    sessionId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    try {
      await this.db.query(
        `
        INSERT INTO event_log (
          id_sesion,
          tipo_evento,
          payload,
          timestamp
        ) VALUES ($1, $2, $3, NOW());
        `,
        [sessionId, eventType, payload]
      );
    } catch (err: any) {
      throw new DatabaseError("DB_EVENT_LOG", err.message);
    }
  }

  async getEvents(sessionId: string): Promise<any[]> {
    try {
      const r = await this.db.query(
        `
        SELECT *
        FROM event_log
        WHERE id_sesion = $1
        ORDER BY timestamp ASC;
        `,
        [sessionId]
      );

      return r.rows;
    } catch (err: any) {
      throw new DatabaseError("DB_EVENT_FETCH", err.message);
    }
  }
}

