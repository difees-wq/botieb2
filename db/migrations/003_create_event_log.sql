CREATE TABLE IF NOT EXISTS event_log (
  id_evento        VARCHAR(64) PRIMARY KEY,
  id_sesion        VARCHAR(64) NOT NULL REFERENCES chat_session(id_sesion),
  tipo_evento      VARCHAR(50) NOT NULL,
  payload          JSONB,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_log_session
  ON event_log(id_sesion);
