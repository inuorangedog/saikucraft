import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local を手動で読む
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
)

const DUMMY_CREATORS = [
  { email: 'creator1@test.local', username: '桜井みづき', bio: 'アニメ塗りが得意です。キャラデザ・立ち絵を中心に活動中。納期厳守！', status: '受付中', call_ok: '可', is_r18_ok: false, is_commercial_ok: true, is_urgent_ok: true },
  { email: 'creator2@test.local', username: '月野うさぎ', bio: '厚塗りメインで描いてます。ファンタジー系が好き。同人誌表紙も承ります。', status: '受付中', call_ok: '要相談', is_r18_ok: true, is_commercial_ok: true, is_urgent_ok: false },
  { email: 'creator3@test.local', username: '紅葉あかね', bio: 'ゆるかわイラスト専門！アイコン・お品書き・グッズデザインお任せください。', status: '受付中', call_ok: '不可', is_r18_ok: false, is_commercial_ok: false, is_urgent_ok: true },
  { email: 'creator4@test.local', username: '蒼空ハル', bio: '背景イラスト・コンセプトアート。CLIP STUDIOとPhotoshopで制作。', status: '受付中', call_ok: '可', is_r18_ok: false, is_commercial_ok: true, is_urgent_ok: false },
  { email: 'creator5@test.local', username: '白雪ことり', bio: '水彩風タッチの柔らかいイラストを描きます。表紙・挿絵が得意です。', status: '受付中', call_ok: '要相談', is_r18_ok: false, is_commercial_ok: true, is_urgent_ok: true },
  { email: 'creator6@test.local', username: '黒崎レイ', bio: 'ダーク・ゴシック系イラスト。VTuberデザインも受付中。', status: '受付中', call_ok: '可', is_r18_ok: true, is_commercial_ok: true, is_urgent_ok: false },
  { email: 'creator7@test.local', username: '花園まりん', bio: 'デフォルメ・ちびキャラが得意！グッズ向けイラストたくさん描いてます。', status: '受付中', call_ok: '不可', is_r18_ok: false, is_commercial_ok: true, is_urgent_ok: true },
  { email: 'creator8@test.local', username: '鈴木たけし', bio: 'リアル系イラスト。似顔絵・肖像画もOK。アナログ＋デジタル。', status: '停止中', call_ok: '可', is_r18_ok: false, is_commercial_ok: true, is_urgent_ok: false },
  { email: 'creator9@test.local', username: '星野ルナ', bio: 'ポップでカラフルなイラスト！ロゴデザインもやってます。', status: '受付中', call_ok: '可', is_r18_ok: false, is_commercial_ok: true, is_urgent_ok: true },
  { email: 'creator10@test.local', username: '風見鶏子', bio: 'TRPG立ち絵・キャラシ用イラスト専門。ファンタジー全般対応。', status: '受付中', call_ok: '要相談', is_r18_ok: true, is_commercial_ok: false, is_urgent_ok: false },
]

const PRICE_MENUS = [
  [
    { label: 'アイコン', price: 3000 },
    { label: 'バストアップ', price: 5000 },
    { label: '全身立ち絵', price: 10000 },
  ],
  [
    { label: '表紙イラスト', price: 15000 },
    { label: 'キャラデザ', price: 20000 },
    { label: '一枚絵', price: 12000 },
  ],
  [
    { label: 'アイコン', price: 2000 },
    { label: 'お品書き', price: 5000 },
    { label: 'グッズデザイン', price: 8000 },
  ],
  [
    { label: '背景イラスト', price: 15000 },
    { label: 'コンセプトアート', price: 25000 },
  ],
  [
    { label: '挿絵', price: 8000 },
    { label: '表紙', price: 12000 },
    { label: 'カットイラスト', price: 4000 },
  ],
  [
    { label: 'VTuberデザイン', price: 30000 },
    { label: 'イラスト1枚', price: 10000 },
  ],
  [
    { label: 'ちびキャラ', price: 2000 },
    { label: 'デフォルメ全身', price: 4000 },
    { label: 'グッズ用セット', price: 10000 },
  ],
  [
    { label: '似顔絵', price: 8000 },
    { label: 'リアルイラスト', price: 20000 },
  ],
  [
    { label: 'ロゴデザイン', price: 10000 },
    { label: 'イラスト1枚', price: 6000 },
  ],
  [
    { label: 'TRPG立ち絵', price: 8000 },
    { label: '差分追加', price: 2000 },
    { label: 'キャラデザ', price: 15000 },
  ],
]

const DUMMY_CLIENTS = [
  { email: 'client1@test.local', username: '田中太郎' },
  { email: 'client2@test.local', username: '佐藤花子' },
  { email: 'client3@test.local', username: 'まるまるサークル' },
]

const DUMMY_LISTINGS = [
  { title: '同人誌の表紙イラスト募集', description: 'ファンタジー系の同人誌の表紙を描いていただけるクリエイターを探しています。A5サイズ、カラー。締切は来月末まで。', budget: 15000, headcount: 1 },
  { title: 'VTuberのキャラデザお願いします', description: '新しくVTuber活動を始めるにあたり、キャラクターデザインをお願いしたいです。女の子キャラ、元気系。', budget: 30000, headcount: 1 },
  { title: 'サークルお品書きデザイン', description: '即売会用のお品書きデザインをお願いします。A4サイズ、商品6点掲載。ポップな雰囲気希望。', budget: 5000, headcount: 3 },
  { title: 'TRPGキャラの立ち絵依頼', description: 'クトゥルフTRPGの探索者の立ち絵をお願いしたいです。バストアップ＋差分3つ。', budget: 10000, headcount: 2 },
]

async function seed() {
  console.log('🌱 Seeding dummy data...')

  // タグを取得
  const { data: tags } = await supabase.from('tags').select('id, name')
  const tagMap = new Map((tags || []).map((t) => [t.name, t.id]))

  const creatorUserIds: string[] = []

  // クリエイター作成
  for (let i = 0; i < DUMMY_CREATORS.length; i++) {
    const c = DUMMY_CREATORS[i]
    console.log(`  Creating creator: ${c.username}`)

    // auth user作成
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: c.email,
      password: 'testpassword123',
      email_confirm: true,
    })

    if (authError) {
      // 既に存在する場合はスキップ
      console.log(`    Skipped (already exists): ${c.email}`)
      const { data: existing } = await supabase.auth.admin.listUsers()
      const found = existing?.users?.find((u) => u.email === c.email)
      if (found) creatorUserIds.push(found.id)
      continue
    }

    const userId = authData.user.id
    creatorUserIds.push(userId)

    // profile作成
    await supabase.from('profiles').insert({
      user_id: userId,
      username: c.username,
      user_type: 'creator',
    })

    // creator_profile作成
    const { data: cp } = await supabase.from('creator_profiles').insert({
      user_id: userId,
      bio: c.bio,
      status: c.status,
      call_ok: c.call_ok,
      is_r18_ok: c.is_r18_ok,
      is_commercial_ok: c.is_commercial_ok,
      is_urgent_ok: c.is_urgent_ok,
    }).select('id').single()

    if (cp) {
      // 料金メニュー
      const menus = PRICE_MENUS[i]
      if (menus) {
        await supabase.from('price_menus').insert(
          menus.map((m, idx) => ({
            creator_id: cp.id,
            label: m.label,
            price: m.price,
            sort_order: idx,
          }))
        )
      }

      // タグをランダムに2-4個つける
      const tagNames = Array.from(tagMap.keys())
      const shuffled = tagNames.sort(() => Math.random() - 0.5)
      const selectedTags = shuffled.slice(0, 2 + Math.floor(Math.random() * 3))
      const tagInserts = selectedTags
        .map((name) => ({ creator_id: cp.id, tag_id: tagMap.get(name)! }))
        .filter((t) => t.tag_id)

      if (tagInserts.length > 0) {
        await supabase.from('creator_tags').insert(tagInserts)
      }
    }
  }

  // クライアント作成
  const clientUserIds: string[] = []
  for (const c of DUMMY_CLIENTS) {
    console.log(`  Creating client: ${c.username}`)

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: c.email,
      password: 'testpassword123',
      email_confirm: true,
    })

    if (authError) {
      console.log(`    Skipped (already exists): ${c.email}`)
      const { data: existing } = await supabase.auth.admin.listUsers()
      const found = existing?.users?.find((u) => u.email === c.email)
      if (found) clientUserIds.push(found.id)
      continue
    }

    const userId = authData.user.id
    clientUserIds.push(userId)

    await supabase.from('profiles').insert({
      user_id: userId,
      username: c.username,
      user_type: 'client',
    })
  }

  // 募集作成
  for (let i = 0; i < DUMMY_LISTINGS.length; i++) {
    const l = DUMMY_LISTINGS[i]
    const clientId = clientUserIds[i % clientUserIds.length]
    if (!clientId) continue

    console.log(`  Creating listing: ${l.title}`)
    await supabase.from('listings').insert({
      client_id: clientId,
      title: l.title,
      description: l.description,
      budget: l.budget,
      headcount: l.headcount,
      status: '募集中',
    })
  }

  console.log('✅ Seed complete!')
  console.log(`   ${creatorUserIds.length} creators, ${clientUserIds.length} clients, ${DUMMY_LISTINGS.length} listings`)
}

seed().catch(console.error)
