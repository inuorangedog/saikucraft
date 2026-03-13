-- BOOSTテーブルにお礼メッセージカラムを追加
ALTER TABLE boosts ADD COLUMN IF NOT EXISTS message text;

-- クリエイタープロフィールに修正設定カラムを追加
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS default_max_detailed_revisions integer NOT NULL DEFAULT 2;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS default_max_final_revisions integer NOT NULL DEFAULT 1;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS revision_policy text;

-- プロフィールテーブルに依頼者向けフィールドを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pixiv_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS misskey_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invoice_number text;

-- 取引テーブルにショーケース許可カラムを追加
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS allow_showcase boolean NOT NULL DEFAULT false;

-- ショーケーステーブルを作成
CREATE TABLE IF NOT EXISTS showcases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid NOT NULL REFERENCES transactions(id),
  creator_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
  caption text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(transaction_id)
);

-- ショーケースのRLSポリシー
ALTER TABLE showcases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "showcases_select_all" ON showcases FOR SELECT USING (true);
CREATE POLICY "showcases_insert_creator" ON showcases FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "showcases_delete_creator" ON showcases FOR DELETE USING (creator_id = auth.uid());
