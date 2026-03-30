-- Add parent_lesson_id to support nested sub-lessons (self-referential)
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS parent_lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS notes_url TEXT;

-- Index for efficient parent->children lookups
CREATE INDEX IF NOT EXISTS idx_lessons_parent_id ON public.lessons(parent_lesson_id);

-- NOTE: Create the Supabase Storage bucket manually in the Supabase dashboard:
--   Bucket name: course-notes
--   Public: true (so files can be accessed via public URL)
--   Allowed MIME types: application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/msword
--
-- Or run via Supabase CLI / SQL if using the storage schema:
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('course-notes', 'course-notes', true)
--   ON CONFLICT (id) DO NOTHING;
--
-- Storage policy: allow authenticated uploads, public reads
-- INSERT INTO storage.policies (name, bucket_id, operation, definition)
--   VALUES
--     ('Allow admin uploads', 'course-notes', 'INSERT', 'true'),
--     ('Allow public reads', 'course-notes', 'SELECT', 'true')
--   ON CONFLICT DO NOTHING;
