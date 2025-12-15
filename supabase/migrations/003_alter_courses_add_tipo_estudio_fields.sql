-- Migration: add tipo_de_estudio1 and tipo_de_estudio2 columns to courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS tipo_de_estudio1 text,
  ADD COLUMN IF NOT EXISTS tipo_de_estudio2 text;

-- Optional future index if filtering by these becomes frequent:
-- CREATE INDEX IF NOT EXISTS idx_courses_tipo_estudio1 ON public.courses(tipo_de_estudio1);
