# Admin Dashboard Setup Guide

## Quick Setup Steps

### 1. Run Database Migrations

Copy and paste these SQL commands into your Supabase SQL Editor:

#### Step 1: Add Admin Role to Users Table

```sql
-- Create enum type for user roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'student' NOT NULL;

-- Create index on role column
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Update RLS policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));
```

#### Step 2: Create Live Sessions Table

```sql
-- Create enum for session status
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
  duration INTEGER NOT NULL DEFAULT 60,
  meeting_url TEXT,
  status session_status DEFAULT 'scheduled' NOT NULL,
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_participants INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all live sessions"
  ON public.live_sessions FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Instructors can manage their sessions"
  ON public.live_sessions FOR ALL
  USING (auth.uid() = instructor_id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'instructor'));

CREATE POLICY "Students can view enrolled course sessions"
  ON public.live_sessions FOR SELECT
  USING (course_id IN (SELECT course_id FROM public.user_courses WHERE user_id = auth.uid()));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_course_id ON public.live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_instructor_id ON public.live_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled_at ON public.live_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON public.live_sessions(status);

-- Create trigger
CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create session_participants table
CREATE TABLE IF NOT EXISTS public.session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all participants"
  ON public.session_participants FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Users can view own participation"
  ON public.session_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON public.session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON public.session_participants(user_id);
```

### 2. Create Your First Admin User

After running the migrations, set a user as admin:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 3. Access the Admin Dashboard

1. Login to your application with the admin user credentials
2. Navigate to: `http://localhost:3000/admin`
3. You should see the admin dashboard!

## Troubleshooting

### Issue: "No token provided" error
**Solution**: Make sure you're logged in and have a valid session in localStorage.

### Issue: "Access denied" error
**Solution**: Verify your user's role is set to 'admin' in the database.

### Issue: Can't access /admin route
**Solution**: Check that the backend server is running on port 4000 and the frontend can reach it.

### Issue: Migrations fail
**Solution**: Make sure you run them in order and that the `update_updated_at_column()` function exists from previous migrations.

## Next Steps

1. ✅ Run migrations
2. ✅ Create admin user
3. ✅ Login and access `/admin`
4. ✅ Explore the dashboard
5. ✅ Test user management
6. ✅ Test course creation
7. ✅ Schedule a live session

Enjoy your new admin dashboard! 🎉
