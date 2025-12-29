-- Create checklist_responses table
CREATE TABLE IF NOT EXISTS public.checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  age TEXT,
  country TEXT,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.checklist_responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (since registration is public)
CREATE POLICY "Public can insert checklist responses"
  ON public.checklist_responses
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow service role to manage everything
CREATE POLICY "Service role can manage checklist responses"
  ON public.checklist_responses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_checklist_responses_email ON public.checklist_responses(email);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_checklist_responses_updated_at
  BEFORE UPDATE ON public.checklist_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
