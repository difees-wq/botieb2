-- Migration: create course_offerings table
-- Each offering references a course via course_sf_id (Salesforce Id of the parent course).
-- Foreign key referencing courses.sf_id ensures referential integrity based on external id.

CREATE TABLE IF NOT EXISTS public.course_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sf_id text UNIQUE NOT NULL,
  course_sf_id text NOT NULL,
  start_date date,
  end_date date,
  price numeric,
  updated_at timestamp without time zone NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT fk_course_offerings_course_sf FOREIGN KEY (course_sf_id)
    REFERENCES public.courses(sf_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_course_offerings_course_sf ON public.course_offerings(course_sf_id);
CREATE INDEX IF NOT EXISTS idx_course_offerings_start_date ON public.course_offerings(start_date);
