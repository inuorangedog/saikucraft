-- 依頼者のStripe Customer ID（銀行振込に必要）
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;
