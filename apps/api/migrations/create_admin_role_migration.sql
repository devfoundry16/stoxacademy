-- Add role column to users table for role-based access control
-- Roles: admin, instructor, student

-- Create enum type for user roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role column to users table with default value 'student'
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'student' NOT NULL;

-- Create index on role column for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Update RLS policies to allow admins to manage all users
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create policy for admins to view all users
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Create policy for admins to update all users
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Create policy for admins to delete users
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Note: To create the first admin user, manually update a user's role:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
