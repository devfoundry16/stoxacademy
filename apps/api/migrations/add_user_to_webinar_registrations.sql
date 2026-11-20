-- The site account created for a webinar registrant (they're auto-enrolled in the webinar session).
ALTER TABLE public.webinar_registrations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
