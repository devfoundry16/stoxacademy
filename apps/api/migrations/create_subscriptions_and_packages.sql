-- =====================================================================
-- 90 Circle subscriptions (3-month all-access program)
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    group_sessions_remaining INTEGER NOT NULL DEFAULT 12,
    individual_sessions_remaining INTEGER NOT NULL DEFAULT 8,
    price_paid DECIMAL(10, 2) NOT NULL,
    stripe_payment_intent_id TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 months'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Service role (backend) handles all writes
CREATE POLICY "Service role manages subscriptions"
    ON user_subscriptions FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================================
-- Individual session packages (3 or 6 sessions)
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_session_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('gold_forex', 'crypto')),
    package_type TEXT NOT NULL CHECK (package_type IN ('3_sessions', '6_sessions')),
    sessions_total INTEGER NOT NULL,
    sessions_remaining INTEGER NOT NULL,
    price_paid DECIMAL(10, 2) NOT NULL,
    stripe_payment_intent_id TEXT,
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_session_packages_user_id ON user_session_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_packages_category ON user_session_packages(category);

-- Enable RLS
ALTER TABLE user_session_packages ENABLE ROW LEVEL SECURITY;

-- Users can only read their own packages
CREATE POLICY "Users can view own session packages"
    ON user_session_packages FOR SELECT
    USING (auth.uid() = user_id);

-- Service role (backend) handles all writes
CREATE POLICY "Service role manages session packages"
    ON user_session_packages FOR ALL
    USING (auth.role() = 'service_role');
