import { Pool } from "pg";
import { LeadDraft } from "../domain/models/lead-draft";
import { DatabaseError } from "../domain/errors";

export class LeadDraftRepository {
  constructor(private readonly db: Pool) {}

  async upsertDraft(draft: LeadDraft): Promise<void> {
    try {
      await this.db.query(
        `
        INSERT INTO lead_draft (
          id_sesion,
          canal_preferido,
          acepto_gdpr,
          cita_fecha,
          cita_hora,
          etiquetas_interes,
          resumen_conversacion
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id_sesion) DO UPDATE SET
          canal_preferido      = EXCLUDED.canal_preferido,
          acepto_gdpr          = EXCLUDED.acepto_gdpr,
          cita_fecha           = EXCLUDED.cita_fecha,
          cita_hora            = EXCLUDED.cita_hora,
          etiquetas_interes    = EXCLUDED.etiquetas_interes,
          resumen_conversacion = EXCLUDED.resumen_conversacion;
        `,
        [
          draft.idSesion,
          draft.canalPreferido,
          draft.aceptoGdpr,
          draft.citaFecha,
          draft.citaHora,
          draft.etiquetasInteres,
          draft.resumenConversacion
        ]
      );
    } catch (err: any) {
      throw new DatabaseError("DB_UPSERT_LEAD_DRAFT", err.message);
    }
  }

  async findBySession(idSesion: string): Promise<LeadDraft | null> {
    try {
      const r = await this.db.query(
        `SELECT * FROM lead_draft WHERE id_sesion = $1`,
        [idSesion]
      );

      if (r.rowCount === 0) return null;

      const row = r.rows[0];

      return {
        idSesion: row.id_sesion,
        canalPreferido: row.canal_preferido,
        aceptoGdpr: row.acepto_gdpr,
        citaFecha: row.cita_fecha,
        citaHora: row.cita_hora,
        etiquetasInteres: row.etiquetas_interes,
        resumenConversacion: row.resumen_conversacion
      };
    } catch (err: any) {
      throw new DatabaseError("DB_FIND_LEAD_DRAFT", err.message);
    }
  }

  async deleteBySession(idSesion: string): Promise<void> {
    try {
      await this.db.query(
        `DELETE FROM lead_draft WHERE id_sesion = $1`,
        [idSesion]
      );
    } catch (err: any) {
      throw new DatabaseError("DB_DELETE_LEAD_DRAFT", err.message);
    }
  }
}
