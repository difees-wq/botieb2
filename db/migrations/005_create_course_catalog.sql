CREATE TABLE IF NOT EXISTS course_catalog (
  id_programa    VARCHAR(50) PRIMARY KEY,
  nombre         TEXT NOT NULL,
  modalidad      TEXT NOT NULL,
  url            TEXT NOT NULL,
  metadatos      JSONB
);
