-- Add score and stage columns to checklist_responses table
ALTER TABLE public.checklist_responses
ADD COLUMN IF NOT EXISTS score DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS stage TEXT;

-- Create index on stage for faster filtering
CREATE INDEX IF NOT EXISTS idx_checklist_responses_stage ON public.checklist_responses(stage);

-- Create index on score for faster sorting/filtering
CREATE INDEX IF NOT EXISTS idx_checklist_responses_score ON public.checklist_responses(score);

