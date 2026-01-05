-- Fix infinite recursion in RLS policies
-- The issue: RLS policies were checking the users table to verify admin status,
-- but checking the users table requires passing the RLS policies, creating infinite recursion.
--
-- Solution: Drop the recursive policies. The service role key (used by supabaseAdmin)
-- automatically bypasses RLS, so admin operations will work without these policies.

-- Drop problematic policies for USERS table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Drop problematic policies for LIVE_SESSIONS table
DROP POLICY IF EXISTS "Admins can manage all live sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Instructors can manage their sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Students can view enrolled course sessions" ON public.live_sessions;

-- Drop problematic policies for SESSION_PARTICIPANTS table
DROP POLICY IF EXISTS "Admins can view all participants" ON public.session_participants;
DROP POLICY IF EXISTS "Users can view own participation" ON public.session_participants;

-- Drop insecure/redundant policies for COURSES table
-- These policies were defined as "Service role can..." but without specifying TO service_role,
-- making them apply to everyone. Service role bypasses RLS anyway.
DROP POLICY IF EXISTS "Service role can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Service role can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Service role can manage user courses" ON public.user_courses;

-- Note: The service role key (SUPABASE_SERVICE_ROLE_KEY) automatically bypasses RLS,
-- so all admin operations using supabaseAdmin will work without these policies.
-- The existing policies for users to view/update their own profiles remain in place.

