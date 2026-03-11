import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)

// クリエイターごとの職種割り当て（名前で指定）
const CREATOR_SPECIALTIES: Record<string, string[]> = {
  '桜井みづき': ['立ち絵', 'SDキャラクター', 'パーツ分けイラスト'],
  '月野うさぎ': ['立ち絵', 'コンセプトアート', '同人誌'],
  '紅葉あかね': ['SDキャラクター', 'グッズ', 'お品書き'],
  '蒼空ハル': ['背景', 'コンセプトアート'],
  '白雪ことり': ['立ち絵', '装丁'],
  '黒崎レイ': ['立ち絵', 'モンスター', 'Live2Dキャラクターモデル'],
  '花園まりん': ['SDキャラクター', 'グッズ', 'ドット絵'],
  '鈴木たけし': ['似顔絵', 'アナログ'],
  '星野ルナ': ['ロゴ', 'フライヤー・チラシ', '配信用素材'],
  '風見鶏子': ['立ち絵', 'コンセプトアート'],
  '雪村いちご': ['立ち絵', 'SDキャラクター'],
  '藤原ゆう': ['漫画', 'ネーム'],
  '天城みお': ['立ち絵', 'UI・Web'],
  '神崎あおい': ['立ち絵', 'アナログ'],
  '西園寺さくら': ['メカ・ロボット', 'コンセプトアート'],
  '東雲ひかり': ['立ち絵', 'パーツ分けイラスト', 'リギング'],
  '御影まこと': ['背景', '背景・ステージ'],
  '水無月れん': ['作曲', 'BGM', '編曲'],
  '霧島かえで': ['立ち絵', '同人誌', '装丁'],
  '朝比奈のぞみ': ['MV', '歌ってみた動画', 'モーショングラフィックス'],
  '高峰つばさ': ['キャラクターモデリング', 'VRChat用アバター'],
  '宮沢りお': ['小説', 'シナリオ'],
  '秋山しずく': ['ドット絵', 'マップチップ', 'アイテム・アイコン'],
  '柊なぎさ': ['立ち絵', 'モンスター', 'コンセプトアート'],
  '如月あやめ': ['漫画', 'ウェブトゥーン'],
  '七瀬ここな': ['キャラクターボイス', 'ASMR', 'ナレーション'],
  '九条るか': ['作曲', '作詞', 'ボカロ調声'],
  '五十嵐すず': ['ロゴ', 'グッズ', '名刺・ショップカード'],
  '北条まひろ': ['Unity', 'UI・HUDデザイン', 'エフェクト'],
  '南条ひなた': ['日英翻訳', '英日翻訳', '字幕翻訳'],
  '葉月そら': ['立ち絵', '一枚絵'],
  '上条ちひろ': ['SE・効果音', 'BGM', 'ミックス'],
  '結城ゆきな': ['PV・ティザー', 'OP・ED風動画'],
  '瀬戸ましろ': ['立ち絵', 'Live2Dキャラクターモデル', 'リギング'],
  '天野みすず': ['歌唱', '演奏', 'ミックス'],
  '久遠あかり': ['ボイスドラマ', 'ボイスドラマ編集', '整音'],
  '白石もえ': ['エディトリアル', '装丁', 'フライヤー・チラシ'],
  '青山はるか': ['背景', 'コンセプトアート', '背景・ステージ'],
  '赤坂りん': ['SDキャラクター', 'ドット絵', 'アイテム・アイコン'],
  '桃井さき': ['立ち絵', 'グッズ', '配信用素材'],
}

// 募集ごとの職種割り当て
const LISTING_SPECIALTIES: Record<string, string[]> = {
  '同人誌の表紙イラスト募集': ['立ち絵', '装丁'],
  'VTuberのキャラデザお願いします': ['立ち絵', 'Live2Dキャラクターモデル'],
  'サークルお品書きデザイン': ['お品書き', 'グッズ'],
  'TRPGキャラの立ち絵依頼': ['立ち絵'],
  'イラスト1枚お願いします': ['立ち絵'],
  '同人誌の表紙絵募集': ['立ち絵', '装丁', '同人誌'],
  'アイコン描いてくれる方': ['立ち絵', 'SDキャラクター'],
  'VTuberの立ち絵募集中': ['立ち絵', 'パーツ分けイラスト'],
  'グッズ用イラスト募集': ['グッズ', 'SDキャラクター'],
  'TRPG探索者の立ち絵お願いします': ['立ち絵'],
  'サークルのロゴデザイン募集': ['ロゴ'],
  '漫画の表紙カラー募集': ['立ち絵', '漫画'],
  'キャラクターデザイン依頼': ['立ち絵', 'コンセプトアート'],
  'お品書きのデザインお願いします': ['お品書き'],
  'ゲーム用キャラドット絵募集': ['ドット絵', 'アイテム・アイコン'],
  '名刺デザインしてくれる方': ['名刺・ショップカード'],
  '挿絵イラスト数点お願いしたい': ['立ち絵'],
  'Xのヘッダー画像作成依頼': ['立ち絵', '配信用素材'],
  'ファンアート描いてほしいです': ['立ち絵'],
  'ウェルカムボードのイラスト': ['立ち絵', 'アナログ'],
  '記念日用の似顔絵依頼': ['似顔絵'],
  'LINEスタンプ用イラスト募集': ['SDキャラクター', 'グッズ'],
  '小説の挿絵を描いてくれる方': ['立ち絵', '背景'],
  '配信用の待機画面イラスト': ['配信用素材', '立ち絵'],
  'オリキャラのデザインシート': ['立ち絵', 'コンセプトアート'],
  'グループの集合絵お願いします': ['立ち絵'],
  'CDジャケット用イラスト募集': ['立ち絵', '装丁'],
  '差分イラスト追加お願い': ['立ち絵'],
  'チラシ用のイラスト募集': ['フライヤー・チラシ', '立ち絵'],
  'ペットの似顔絵描いてほしい': ['似顔絵', 'アナログ'],
  'ウェディング用イラスト依頼': ['立ち絵', 'アナログ'],
  'ボドゲカード用イラスト募集': ['立ち絵', 'グッズ'],
  '背景イラスト3枚お願いします': ['背景'],
  'SNSアイコンセット募集': ['立ち絵', 'SDキャラクター'],
}

async function seedSpecialties() {
  console.log('🏷️  Seeding specialties...')

  // 全職種を取得
  const { data: specialties } = await supabase.from('specialties').select('id, name, description')
  if (!specialties) { console.error('No specialties found'); return }

  // nameで引けるmap（Live2Dの「キャラクター」は descriptionで区別）
  const specMap = new Map<string, string>()
  for (const s of specialties) {
    if (s.description) {
      specMap.set(s.description, s.id) // descriptionでも引ける
    }
    // 重複名はcategory付きで上書きされるが、最初に出た方が残る
    if (!specMap.has(s.name)) {
      specMap.set(s.name, s.id)
    }
  }

  // クリエイターに職種を紐付け
  const { data: profiles } = await supabase.from('profiles').select('user_id, username')
  const { data: creatorProfiles } = await supabase.from('creator_profiles').select('id, user_id')

  if (!profiles || !creatorProfiles) return

  const userToCreatorId = new Map(creatorProfiles.map(cp => [cp.user_id, cp.id]))
  const usernameToUserId = new Map(profiles.map(p => [p.username, p.user_id]))

  let creatorCount = 0
  for (const [username, specNames] of Object.entries(CREATOR_SPECIALTIES)) {
    const userId = usernameToUserId.get(username)
    if (!userId) continue
    const creatorId = userToCreatorId.get(userId)
    if (!creatorId) continue

    const inserts = specNames
      .map(name => ({ creator_id: creatorId, specialty_id: specMap.get(name)! }))
      .filter(i => i.specialty_id)

    if (inserts.length > 0) {
      await supabase.from('creator_specialties').upsert(inserts, { onConflict: 'creator_id,specialty_id' })
      creatorCount++
    }
  }

  // 募集に職種を紐付け
  const { data: listings } = await supabase.from('listings').select('id, title')
  if (!listings) return

  let listingCount = 0
  for (const listing of listings) {
    const specNames = LISTING_SPECIALTIES[listing.title]
    if (!specNames) continue

    const inserts = specNames
      .map(name => ({ listing_id: listing.id, specialty_id: specMap.get(name)! }))
      .filter(i => i.specialty_id)

    if (inserts.length > 0) {
      await supabase.from('listing_specialties').upsert(inserts, { onConflict: 'listing_id,specialty_id' })
      listingCount++
    }
  }

  console.log(`✅ Done! ${creatorCount} creators, ${listingCount} listings with specialties`)
}

seedSpecialties().catch(console.error)
