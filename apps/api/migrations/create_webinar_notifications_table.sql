-- Scheduled emails and WhatsApp messages for free webinar registrants
CREATE TABLE IF NOT EXISTS public.webinar_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.webinar_registrations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  template_key TEXT NOT NULL, -- confirmation | countdown_1..14 | reminder_10d..2d | reminder_1h
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (registration_id, channel, template_key)
);

CREATE INDEX IF NOT EXISTS idx_webinar_notifications_due
  ON public.webinar_notifications(scheduled_for) WHERE status = 'pending';

-- Accessed only through the API (service role).
ALTER TABLE public.webinar_notifications ENABLE ROW LEVEL SECURITY;
