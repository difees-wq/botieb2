CREATE TABLE IF NOT EXISTS message_log (
  id_mensaje       VARCHAR(64) PRIMARY KEY,
  id_sesion        VARCHAR(64) NOT NULL REFERENCES chat_session(id_sesion),
  tipo             VARCHAR(20) NOT NULL,     -- USER | BOT
  contenido        TEXT NOT NULL,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_log_session
  ON message_log(id_sesion);