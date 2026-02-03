-- Add coupon tracking columns to user_courses table

ALTER TABLE public.user_courses
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER,
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- Add coupon tracking columns to user_live_sessions table

ALTER TABLE public.user_live_sessions
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER,
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- Create indexes for coupon tracking
CREATE INDEX IF NOT EXISTS idx_user_courses_coupon_code ON public.user_courses(coupon_code);
CREATE INDEX IF NOT EXISTS idx_user_live_sessions_coupon_code ON public.user_live_sessions(coupon_code);
