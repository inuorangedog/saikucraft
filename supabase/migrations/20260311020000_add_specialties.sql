-- 職種（スペシャリティ）テーブル
create table specialties (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  description text,
  sort_order integer not null default 0
);

-- クリエイター × 職種 中間テーブル
create table creator_specialties (
  creator_id uuid not null references creator_profiles(id) on delete cascade,
  specialty_id uuid not null references specialties(id) on delete cascade,
  primary key (creator_id, specialty_id)
);

-- RLS
alter table specialties enable row level security;
alter table creator_specialties enable row level security;

-- specialties: 誰でも閲覧可
create policy "specialties_select" on specialties for select using (true);

-- creator_specialties: 誰でも閲覧可
create policy "creator_specialties_select" on creator_specialties for select using (true);

-- creator_specialties: 自分のクリエイタープロフィールに紐付くもののみ追加可
create policy "creator_specialties_insert" on creator_specialties for insert with check (
  creator_id in (
    select id from creator_profiles where user_id = auth.uid()
  )
);

-- creator_specialties: 自分のクリエイタープロフィールに紐付くもののみ削除可
create policy "creator_specialties_delete" on creator_specialties for delete using (
  creator_id in (
    select id from creator_profiles where user_id = auth.uid()
  )
);

-- 初期データ投入
insert into specialties (category, name, description, sort_order) values
  -- イラスト
  ('イラスト', 'キャラクター', null, 1),
  ('イラスト', '背景', null, 2),
  ('イラスト', 'SDキャラクター', null, 3),
  ('イラスト', 'モンスター', null, 4),
  ('イラスト', 'メカ・ロボット', null, 5),
  ('イラスト', '似顔絵', null, 6),
  ('イラスト', 'ドット絵', null, 7),
  ('イラスト', 'アナログ', null, 8),
  ('イラスト', 'コンセプトアート', null, 9),
  ('イラスト', 'パーツ分けイラスト', 'Live2D・Spine等のアニメーション用', 10),
  -- 漫画
  ('漫画', '漫画', null, 11),
  ('漫画', 'ネーム', null, 12),
  ('漫画', 'コマ割り', null, 13),
  ('漫画', 'ウェブトゥーン', null, 14),
  ('漫画', '同人誌', null, 15),
  -- デザイン
  ('デザイン', 'ロゴ', null, 16),
  ('デザイン', '装丁', null, 17),
  ('デザイン', 'エディトリアル', null, 18),
  ('デザイン', 'グッズ', null, 19),
  ('デザイン', 'UI・Web', null, 20),
  ('デザイン', 'お品書き', null, 21),
  ('デザイン', '名刺・ショップカード', null, 22),
  ('デザイン', 'フライヤー・チラシ', null, 23),
  ('デザイン', '配信用素材', 'オーバーレイ・アラート・待機画面など', 24),
  -- Live2D
  ('Live2D', '一枚絵', null, 25),
  ('Live2D', 'キャラクター', 'Live2Dキャラクターモデル', 26),
  ('Live2D', 'リギング', null, 27),
  -- 3D
  ('3D', 'キャラクターモデリング', null, 28),
  ('3D', '背景・ステージ', null, 29),
  ('3D', '小道具・アイテム', null, 30),
  ('3D', 'VRChat用アバター', null, 31),
  ('3D', 'MMDモデル', null, 32),
  -- 音楽
  ('音楽', '作曲', null, 33),
  ('音楽', '作詞', null, 34),
  ('音楽', '編曲', null, 35),
  ('音楽', 'マスタリング', null, 36),
  ('音楽', 'ミックス', null, 37),
  ('音楽', 'SE・効果音', null, 38),
  ('音楽', 'BGM', null, 39),
  ('音楽', '歌唱', null, 40),
  ('音楽', 'ボカロ調声', null, 41),
  ('音楽', '演奏', null, 42),
  -- 声・音声
  ('声・音声', 'キャラクターボイス', null, 43),
  ('声・音声', 'ASMR', null, 44),
  ('声・音声', 'ボイスドラマ', null, 45),
  ('声・音声', 'ボイスドラマ編集', null, 46),
  ('声・音声', 'ナレーション', null, 47),
  ('声・音声', '整音', null, 48),
  -- 動画・映像
  ('動画・映像', 'MV', null, 49),
  ('動画・映像', '歌ってみた動画', null, 50),
  ('動画・映像', '踊ってみた動画', null, 51),
  ('動画・映像', 'OP・ED風動画', null, 52),
  ('動画・映像', 'PV・ティザー', null, 53),
  ('動画・映像', 'モーショングラフィックス', null, 54),
  ('動画・映像', 'MAD・AMV', null, 55),
  -- ライティング
  ('ライティング', '小説', null, 56),
  ('ライティング', 'シナリオ', null, 57),
  ('ライティング', 'コピーライティング', null, 58),
  -- ゲーム制作
  ('ゲーム制作', 'UI・HUDデザイン', null, 59),
  ('ゲーム制作', 'マップチップ', null, 60),
  ('ゲーム制作', 'エフェクト', null, 61),
  ('ゲーム制作', 'アイテム・アイコン', null, 62),
  -- プログラミング
  ('プログラミング', 'Unity', null, 63),
  ('プログラミング', 'Godot', null, 64),
  ('プログラミング', 'RPGツクール', null, 65),
  ('プログラミング', 'Unreal Engine', null, 66),
  ('プログラミング', 'Web', null, 67),
  -- 翻訳
  ('翻訳', '日英翻訳', null, 68),
  ('翻訳', '英日翻訳', null, 69),
  ('翻訳', '字幕翻訳', null, 70)
on conflict do nothing;
