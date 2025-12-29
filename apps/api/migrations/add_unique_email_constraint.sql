-- Add unique constraint to email column to prevent duplicate submissions
ALTER TABLE public.checklist_responses
ADD CONSTRAINT unique_checklist_email UNIQUE (email);
