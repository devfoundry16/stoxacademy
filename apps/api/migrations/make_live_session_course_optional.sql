-- Live sessions (e.g. free webinars) no longer have to belong to a course
ALTER TABLE public.live_sessions ALTER COLUMN course_id DROP NOT NULL;
