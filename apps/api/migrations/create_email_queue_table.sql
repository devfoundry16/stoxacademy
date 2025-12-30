-- Create email_queue table to track scheduled emails
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_response_id UUID REFERENCES public.checklist_responses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('score_delivery', 'education', 'soft_cta', 'direct_cta')),
  stage TEXT NOT NULL CHECK (stage IN ('awareness', 'builder', 'professional', 'investor')),
  score DECIMAL(3,1) NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_for ON public.email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_checklist_response_id ON public.email_queue(checklist_response_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);

-- Enable Row Level Security
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage everything
CREATE POLICY "Service role can manage email queue"
  ON public.email_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

