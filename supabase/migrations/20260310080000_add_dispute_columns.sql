-- 異議解決の記録用カラム
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS dispute_resolution text,
  ADD COLUMN IF NOT EXISTS dispute_admin_note text,
  ADD COLUMN IF NOT EXISTS dispute_resolved_at timestamptz;
