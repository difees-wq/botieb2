-- Migration: create courses table
-- Creates the courses catalog table storing Salesforce-sourced data.
-- id: internal UUID PK; sf_id: external Salesforce Id (unique)
-- updated_at: auto-updated timestamp on write

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sf_id text UNIQUE NOT NULL,
  name text NOT NULL,
  type text,
  description text,
  url text,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamp without time zone NOT NULL DEFAULT timezone('utc', now())
);

-- Helpful index for active lookup & name searches (trigram could be added later)
CREATE INDEX IF NOT EXISTS idx_courses_active ON public.courses(active);
CREATE INDEX IF NOT EXISTS idx_courses_name ON public.courses(name);
