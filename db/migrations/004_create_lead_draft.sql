CREATE TABLE IF NOT EXISTS lead_draft (
  id_sesion            VARCHAR(64) PRIMARY KEY REFERENCES chat_session(id_sesion),
  canal_preferido      VARCHAR(50),
  acepto_gdpr          BOOLEAN,
  cita_fecha           VARCHAR(20),
  cita_hora            VARCHAR(20),
  etiquetas_interes    TEXT[],
  resumen_conversacion TEXT,
  updated_at           TIMESTAMP DEFAULT NOW()
);
