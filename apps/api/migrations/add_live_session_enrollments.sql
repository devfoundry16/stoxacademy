-- Add price field to live_sessions table
ALTER TABLE public.live_sessions
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0 NOT NULL;

-- Create user_live_sessions table for tracking enrollments/purchases
CREATE TABLE IF NOT EXISTS public.user_live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  price_paid DECIMAL(10,2) NOT NULL,
  UNIQUE(user_id, session_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_live_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own enrollments
CREATE POLICY "Users can view their own live session enrollments"
  ON public.user_live_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own enrollments
CREATE POLICY "Users can enroll in live sessions"
  ON public.user_live_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_live_sessions_user_id ON public.user_live_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_live_sessions_session_id ON public.user_live_sessions(session_id);

-- Add participants_count to live_sessions for tracking
ALTER TABLE public.live_sessions
ADD COLUMN IF NOT EXISTS participants_count INTEGER DEFAULT 0 NOT NULL;

-- Update existing RLS policies to allow public viewing of live sessions
DROP POLICY IF EXISTS "Students can view enrolled course sessions" ON public.live_sessions;

-- Allow everyone to view live sessions (for browsing)
CREATE POLICY "Everyone can view live sessions"
  ON public.live_sessions
  FOR SELECT
  USING (true);
