-- Add video SDK room fields to live_sessions
-- meeting_url remains for backward compatibility but is no longer required

ALTER TABLE public.live_sessions
ADD COLUMN IF NOT EXISTS video_room_name TEXT;

ALTER TABLE public.live_sessions
ADD COLUMN IF NOT EXISTS video_provider TEXT;

-- Backfill: existing rows keep meeting_url; new rows will use video_room_name + video_provider
COMMENT ON COLUMN public.live_sessions.video_room_name IS 'Daily.co room name (or other provider room id)';
COMMENT ON COLUMN public.live_sessions.video_provider IS 'e.g. daily, 100ms; null if using meeting_url';
