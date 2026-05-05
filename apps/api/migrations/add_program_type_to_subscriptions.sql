-- Add program_type to user_subscriptions so each 90 Circle program
-- (stock_market, gold_forex, crypto) tracks its own active subscription.
-- Existing rows default to 'stock_market' (safe fallback; can be updated manually).

ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS program_type TEXT NOT NULL DEFAULT 'stock_market'
        CHECK (program_type IN ('stock_market', 'gold_forex', 'crypto'));

-- Index for fast per-user, per-program lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_program_type
    ON user_subscriptions(user_id, program_type);
