-- Create coupons table for discount management

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  percentage INTEGER NOT NULL CHECK (percentage >= 1 AND percentage <= 100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all coupons
CREATE POLICY "Admins can manage all coupons"
  ON public.coupons
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Create policy for authenticated users to view active coupons
CREATE POLICY "Users can view active coupons"
  ON public.coupons
  FOR SELECT
  USING (is_active = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON public.coupons(created_at);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
