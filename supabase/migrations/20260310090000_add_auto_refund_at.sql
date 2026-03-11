-- 自動返金予定日時カラム（締め切り+3日でセット）
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS auto_refund_at timestamptz;

-- deadline_exceeded_countカラム（締め切り超過回数の正確なカウント）
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS deadline_exceeded_count integer DEFAULT 0;
