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

const CREATOR_TAGS: Record<string, string[]> = {
  '桜井みづき': ['アニメ塗り', 'CLIP STUDIO', 'ファンタジー'],
  '月野うさぎ': ['厚塗り', 'Photoshop', 'ファンタジー', 'コミケ'],
  '紅葉あかね': ['ゆるかわ', 'ポップ', 'ibis Paint'],
  '蒼空ハル': ['リアル', 'CLIP STUDIO', 'Photoshop'],
  '白雪ことり': ['水彩風', 'Procreate', 'コミティア'],
  '黒崎レイ': ['ダーク', 'ゴシック', 'CLIP STUDIO'],
  '花園まりん': ['ゆるかわ', 'ポップ', 'CLIP STUDIO', 'コミケ'],
  '鈴木たけし': ['リアル', 'アナログ', 'Photoshop'],
  '星野ルナ': ['ポップ', 'Illustrator', 'SF・近未来'],
  '風見鶏子': ['ファンタジー', 'CLIP STUDIO', 'コミケ'],
  '雪村いちご': ['アニメ塗り', 'ギャルゲ塗り', 'CLIP STUDIO'],
  '藤原ゆう': ['アニメ塗り', 'CLIP STUDIO', 'コミケ', 'コミティア'],
  '天城みお': ['ポップ', 'Photoshop', 'Illustrator'],
  '神崎あおい': ['和風', 'アナログ', '水彩風'],
  '西園寺さくら': ['SF・近未来', 'CLIP STUDIO', 'リアル'],
  '東雲ひかり': ['アニメ塗り', 'CLIP STUDIO', 'Live2D Cubism'],
  '御影まこと': ['リアル', 'Photoshop', 'ファンタジー'],
  '水無月れん': ['ボカロ系', 'Cubase', 'FL Studio', 'M3'],
  '霧島かえで': ['厚塗り', 'CLIP STUDIO', 'コミケ'],
  '朝比奈のぞみ': ['ポップ', 'After Effects', 'Premiere Pro'],
  '高峰つばさ': ['ファンタジー', 'Blender', 'VRoid Studio'],
  '宮沢りお': ['ファンタジー', 'ダーク', 'コミティア'],
  '秋山しずく': ['ポップ', 'ゆるかわ', 'CLIP STUDIO'],
  '柊なぎさ': ['ダーク', 'ファンタジー', 'Photoshop'],
  '如月あやめ': ['アニメ塗り', 'CLIP STUDIO', 'コミティア'],
  '七瀬ここな': ['萌え系', '元気系'],
  '九条るか': ['ボカロ系', 'エレクトロ', 'FL Studio', 'ボーマス'],
  '五十嵐すず': ['ポップ', 'Illustrator', 'Photoshop'],
  '北条まひろ': ['SF・近未来', 'Unity', 'Blender'],
  '南条ひなた': ['アニメ塗り', 'コミケ'],
  '葉月そら': ['アニメ塗り', 'ギャルゲ塗り', 'SAI'],
  '上条ちひろ': ['エレクトロ', 'アンビエント', 'Ableton Live', 'M3'],
  '結城ゆきな': ['ポップ', 'After Effects', 'DaVinci Resolve'],
  '瀬戸ましろ': ['アニメ塗り', 'CLIP STUDIO', 'Live2D Cubism'],
  '天野みすず': ['クラシカル', 'ジャズ', 'Pro Tools'],
  '久遠あかり': ['クール系', '低音', 'Studio One'],
  '白石もえ': ['ポップ', 'Illustrator', 'Photoshop'],
  '青山はるか': ['リアル', 'Photoshop', 'Blender'],
  '赤坂りん': ['ゆるかわ', 'ポップ', 'CLIP STUDIO'],
  '桃井さき': ['アニメ塗り', 'ポップ', 'CLIP STUDIO', 'コミケ'],
}

async function seedTags() {
  console.log('🏷️  Seeding creator tags...')

  const { data: tags } = await supabase.from('tags').select('id, name')
  if (!tags) { console.error('No tags'); return }
  const tagMap = new Map(tags.map(t => [t.name, t.id]))

  const { data: profiles } = await supabase.from('profiles').select('user_id, username')
  const { data: creatorProfiles } = await supabase.from('creator_profiles').select('id, user_id')
  if (!profiles || !creatorProfiles) return

  const userToCreatorId = new Map(creatorProfiles.map(cp => [cp.user_id, cp.id]))
  const usernameToUserId = new Map(profiles.map(p => [p.username, p.user_id]))

  let count = 0
  for (const [username, tagNames] of Object.entries(CREATOR_TAGS)) {
    const userId = usernameToUserId.get(username)
    if (!userId) continue
    const creatorId = userToCreatorId.get(userId)
    if (!creatorId) continue

    // 既存のタグを削除
    await supabase.from('creator_tags').delete().eq('creator_id', creatorId)

    const inserts = tagNames
      .map(name => ({ creator_id: creatorId, tag_id: tagMap.get(name)! }))
      .filter(i => i.tag_id)

    if (inserts.length > 0) {
      await supabase.from('creator_tags').insert(inserts)
      count++
    }
  }

  console.log(`✅ Done! ${count} creators with tags`)
}

seedTags().catch(console.error)
