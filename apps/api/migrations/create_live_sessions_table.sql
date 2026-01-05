-- Create live_sessions table for managing live online course sessions

-- Create enum type for session status
DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create live_sessions table
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- Duration in minutes
  meeting_url TEXT,
  status session_status DEFAULT 'scheduled' NOT NULL,
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_participants INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all sessions
CREATE POLICY "Admins can manage all live sessions"
  ON public.live_sessions
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Create policy for instructors to manage their own sessions
CREATE POLICY "Instructors can manage their sessions"
  ON public.live_sessions
  FOR ALL
  USING (
    auth.uid() = instructor_id OR
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'instructor'
    )
  );

-- Create policy for students to view sessions for courses they're enrolled in
CREATE POLICY "Students can view enrolled course sessions"
  ON public.live_sessions
  FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM public.user_courses WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_sessions_course_id ON public.live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_instructor_id ON public.live_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled_at ON public.live_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON public.live_sessions(status);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create table for tracking session participants
CREATE TABLE IF NOT EXISTS public.session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS for session_participants
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all participants
CREATE POLICY "Admins can view all participants"
  ON public.session_participants
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Create policy for users to view their own participation
CREATE POLICY "Users can view own participation"
  ON public.session_participants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index on session_participants
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON public.session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON public.session_participants(user_id);
