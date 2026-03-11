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

const NAMES = [
  '雪村いちご', '藤原ゆう', '天城みお', '神崎あおい', '西園寺さくら',
  '東雲ひかり', '御影まこと', '水無月れん', '霧島かえで', '朝比奈のぞみ',
  '高峰つばさ', '宮沢りお', '秋山しずく', '柊なぎさ', '如月あやめ',
  '七瀬ここな', '九条るか', '五十嵐すず', '北条まひろ', '南条ひなた',
  '葉月そら', '上条ちひろ', '結城ゆきな', '瀬戸ましろ', '天野みすず',
  '久遠あかり', '白石もえ', '青山はるか', '赤坂りん', '桃井さき',
]

const BIOS = [
  '可愛い女の子を描くのが大好きです！アイコン・立ち絵お任せ。',
  '漫画もイラストもどちらも対応。週刊連載経験あり。',
  'ゲームのキャラデザ・UIデザインが得意。Unity案件も可。',
  '和風イラスト専門。着物・和装キャラなら任せてください。',
  'メカ・ロボット・SF系が好き。設定画も描けます。',
  '動物イラスト・擬人化が得意。ペットの似顔絵も。',
  'BL・女性向けイラストを中心に活動中。',
  '食べ物イラスト・レシピカードデザインが得意です。',
  'ホラー・ダークファンタジー大好き。装丁デザインも。',
  'エフェクト・魔法陣など素材制作もやってます。',
  'Live2Dモデリングも対応。VTuber案件歓迎！',
  '子ども向けイラスト・絵本の挿絵が得意です。',
  'ドット絵・ピクセルアート専門。ゲーム素材に。',
  '風景画・背景美術。アニメ背景の仕事もしてました。',
  'コミケ歴10年。同人誌表紙はお手の物です。',
  'ファッションイラスト・コーデ提案もできます。',
  'クリーチャー・モンスターデザインが大好きです。',
  'カリグラフィー・レタリングも対応。ロゴお任せ。',
  'ボードゲームのイラスト・デザインもやってます。',
  '線画に自信あり。ペン入れだけの依頼もOK。',
  'キャラ設定から考えるのが好きです。一緒に作りましょう。',
  '透明感のある塗りが持ち味。光の表現にこだわります。',
  'デフォルメからリアルまで幅広く対応できます。',
  'ミニチュア風イラスト・アイソメトリックが得意。',
  '筋肉・格闘系キャラなら誰にも負けません。',
  'パステルカラーの柔らかいイラストが得意です。',
  'ネイルアート風のデザインイラストもやってます。',
  'TCG用イラスト制作経験あり。カードゲーム歓迎。',
  '建築パース・インテリアイラストも描けます。',
  '伝統的な水墨画スタイルで描きます。',
]

const STATUSES: ('受付中' | '停止中')[] = ['受付中', '受付中', '受付中', '受付中', '停止中']
const CALL_OKS: ('可' | '不可' | '要相談')[] = ['可', '不可', '要相談']

const LISTING_TITLES = [
  'イラスト1枚お願いします',
  '同人誌の表紙絵募集',
  'アイコン描いてくれる方',
  'VTuberの立ち絵募集中',
  'グッズ用イラスト募集',
  'TRPG探索者の立ち絵お願いします',
  'サークルのロゴデザイン募集',
  '漫画の表紙カラー募集',
  'キャラクターデザイン依頼',
  'お品書きのデザインお願いします',
  'ゲーム用キャラドット絵募集',
  '名刺デザインしてくれる方',
  '挿絵イラスト数点お願いしたい',
  'Xのヘッダー画像作成依頼',
  'ファンアート描いてほしいです',
  'ウェルカムボードのイラスト',
  '記念日用の似顔絵依頼',
  'LINEスタンプ用イラスト募集',
  '小説の挿絵を描いてくれる方',
  '配信用の待機画面イラスト',
  'オリキャラのデザインシート',
  'グループの集合絵お願いします',
  'CDジャケット用イラスト募集',
  '差分イラスト追加お願い',
  'チラシ用のイラスト募集',
  'ペットの似顔絵描いてほしい',
  'ウェディング用イラスト依頼',
  'ボドゲカード用イラスト募集',
  '背景イラスト3枚お願いします',
  'SNSアイコンセット募集',
]

const LISTING_DESCS = [
  'オリジナルキャラのイラストを描いていただきたいです。詳細はDMで。',
  '即売会に向けて制作中です。雰囲気はお任せしますが、ファンタジー系が好みです。',
  '普段使い用のアイコンを描いてほしいです。シンプルめが好き。',
  '活動開始に合わせてお願いしたいです。元気で明るい雰囲気希望。',
  'アクリルキーホルダー用のイラストです。背景透過で納品希望。',
  'セッション用の立ち絵です。表情差分3つ希望。',
  '新しく立ち上げるサークルのロゴをお願いしたいです。',
  '既刊の表紙を描いていただけるクリエイターを探しています。',
  'オリジナルキャラクターのデザインを一からお願いしたいです。',
  '即売会用のお品書きデザインです。商品数は8点前後。',
]

const BUDGETS = [3000, 5000, 8000, 10000, 12000, 15000, 20000, 25000, 30000, 50000]

async function seedBulk() {
  console.log('🌱 Bulk seeding...')

  const { data: tags } = await supabase.from('tags').select('id, name')
  const tagMap = new Map((tags || []).map((t) => [t.name, t.id]))
  const tagNames = Array.from(tagMap.keys())

  // 追加クリエイター30人
  let createdCreators = 0
  for (let i = 0; i < NAMES.length; i++) {
    const email = `creator_extra_${i + 1}@test.local`
    const username = NAMES[i]
    console.log(`  Creator: ${username}`)

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true,
    })

    if (authError) {
      console.log(`    Skipped: ${email}`)
      continue
    }

    const userId = authData.user.id

    await supabase.from('profiles').insert({
      user_id: userId,
      username,
      user_type: 'creator',
    })

    const status = STATUSES[i % STATUSES.length]
    const callOk = CALL_OKS[i % CALL_OKS.length]

    const { data: cp } = await supabase.from('creator_profiles').insert({
      user_id: userId,
      bio: BIOS[i % BIOS.length],
      status,
      call_ok: callOk,
      is_r18_ok: i % 4 === 0,
      is_commercial_ok: i % 3 !== 0,
      is_urgent_ok: i % 2 === 0,
    }).select('id').single()

    if (cp) {
      // 料金メニュー
      const prices = [
        { label: 'アイコン', price: 2000 + (i % 5) * 1000 },
        { label: 'バストアップ', price: 5000 + (i % 4) * 2000 },
        { label: '全身', price: 10000 + (i % 3) * 5000 },
      ]
      await supabase.from('price_menus').insert(
        prices.map((p, idx) => ({ creator_id: cp.id, ...p, sort_order: idx }))
      )

      // タグ
      const shuffled = [...tagNames].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, 2 + Math.floor(Math.random() * 3))
      const inserts = selected.map(n => ({ creator_id: cp.id, tag_id: tagMap.get(n)! })).filter(t => t.tag_id)
      if (inserts.length > 0) await supabase.from('creator_tags').insert(inserts)
    }

    createdCreators++
  }

  // 追加クライアント5人
  const clientIds: string[] = []
  const CLIENT_NAMES = ['山田一郎', '鈴木二郎', '高橋三郎', '渡辺四郎', '伊藤五郎']
  for (let i = 0; i < CLIENT_NAMES.length; i++) {
    const email = `client_extra_${i + 1}@test.local`
    console.log(`  Client: ${CLIENT_NAMES[i]}`)

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true,
    })

    if (authError) {
      console.log(`    Skipped: ${email}`)
      // 既存のIDを取得
      const { data: existing } = await supabase.auth.admin.listUsers()
      const found = existing?.users?.find(u => u.email === email)
      if (found) clientIds.push(found.id)
      continue
    }

    clientIds.push(authData.user.id)
    await supabase.from('profiles').insert({
      user_id: authData.user.id,
      username: CLIENT_NAMES[i],
      user_type: 'client',
    })
  }

  // 既存のクライアントIDも取得
  const { data: existingClients } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_type', 'client')
  const allClientIds = [...new Set([...clientIds, ...(existingClients || []).map(c => c.user_id)])]

  // 追加募集30件
  let createdListings = 0
  for (let i = 0; i < LISTING_TITLES.length; i++) {
    const clientId = allClientIds[i % allClientIds.length]
    if (!clientId) continue

    console.log(`  Listing: ${LISTING_TITLES[i]}`)
    await supabase.from('listings').insert({
      client_id: clientId,
      title: LISTING_TITLES[i],
      description: LISTING_DESCS[i % LISTING_DESCS.length],
      budget: BUDGETS[i % BUDGETS.length],
      headcount: 1 + (i % 3),
      status: '募集中',
    })
    createdListings++
  }

  console.log(`✅ Bulk seed complete!`)
  console.log(`   +${createdCreators} creators, +${clientIds.length} clients, +${createdListings} listings`)
}

seedBulk().catch(console.error)
