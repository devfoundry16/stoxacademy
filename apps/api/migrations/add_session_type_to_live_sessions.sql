-- Webinars reuse live_sessions: host broadcasts video, guests listen + chat and may request to speak (audio only)
ALTER TABLE public.live_sessions
ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'live'
CHECK (session_type IN ('live', 'webinar'));
