-- Free webinar registrations from the /funnel landing page
CREATE TABLE IF NOT EXISTS public.webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserts go through the API (service role); no public access.
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;
