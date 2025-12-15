CREATE TABLE IF NOT EXISTS chat_session (
  id_sesion        VARCHAR(64) PRIMARY KEY,
  tipo_estudio     VARCHAR(50) NOT NULL,
  estado_flujo     VARCHAR(50) NOT NULL,
  url_contexto     TEXT,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);
