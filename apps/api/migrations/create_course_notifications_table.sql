-- Purchase confirmation and session reminders for Gold & Forex funnel buyers
CREATE TABLE IF NOT EXISTS public.course_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_course_id UUID NOT NULL REFERENCES public.user_courses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp')),
  template_key TEXT NOT NULL, -- confirmation | s1_morning | s1_1h | ... | s8_1h
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_course_id, channel, template_key)
);

CREATE INDEX IF NOT EXISTS idx_course_notifications_due
  ON public.course_notifications(scheduled_for) WHERE status = 'pending';

-- Accessed only through the API (service role).
ALTER TABLE public.course_notifications ENABLE ROW LEVEL SECURITY;
