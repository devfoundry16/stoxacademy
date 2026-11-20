-- Each free webinar registration belongs to a webinar live session (live_sessions.session_type = 'webinar'),
-- so the date and link come from the session instead of code.
ALTER TABLE public.webinar_registrations
  ADD COLUMN IF NOT EXISTS live_session_id UUID REFERENCES public.live_sessions(id) ON DELETE SET NULL;

-- Registrations made before this column existed were for the 2 Dec 2026 webinar.
UPDATE public.webinar_registrations
  SET live_session_id = '48d99176-77c2-4965-8774-d8c19685a72f'
  WHERE live_session_id IS NULL
    AND EXISTS (SELECT 1 FROM public.live_sessions WHERE id = '48d99176-77c2-4965-8774-d8c19685a72f');

-- One registration per email per webinar (was: per email forever, which blocked a second webinar).
ALTER TABLE public.webinar_registrations DROP CONSTRAINT IF EXISTS webinar_registrations_email_key;
ALTER TABLE public.webinar_registrations
  ADD CONSTRAINT webinar_registrations_email_session_key UNIQUE (email, live_session_id);
