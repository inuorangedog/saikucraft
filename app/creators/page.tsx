import { createClient } from '@/app/lib/supabase-server'
import CreatorCard from './_components/creator-card'
import CreatorFilters from './_components/creator-filters'
import Pagination from '@/app/_components/pagination'
import { getAllTags } from '@/app/lib/tags'
import { getUpcomingEvents } from '@/app/lib/events'
import { getAllSpecialties } from '@/app/lib/specialties'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'クリエイター一覧',
  description: '手描きクリエイターを探して、あなたの作品を依頼しましょう。イラスト・デザインのコミッション依頼はSaikuCraftで。',
  openGraph: {
    title: 'クリエイター一覧',
    description: '手描きクリエイターを探して、あなたの作品を依頼しましょう。',
  },
}

const PER_PAGE = 12

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function CreatorsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1'))
  const statusFilter = params.status || ''
  const r18Filter = params.r18 === '1'
  const commercialFilter = params.commercial === '1'
  const urgentFilter = params.urgent === '1'
  const tagFilter = params.tags?.split(',').filter(Boolean) || []
  const eventFilter = params.event || ''
  const specialtyFilter = params.specialty || ''

  const supabase = await createClient()
  const allTags = await getAllTags()
  const allEvents = await getUpcomingEvents()
  const allSpecialties = await getAllSpecialties()

  // ブロックしたユーザーを除外
  const { data: { user } } = await supabase.auth.getUser()
  let blockedIds: string[] = []
  if (user) {
    const { data: blocks } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id)
    blockedIds = (blocks || []).map((b) => b.blocked_id)
  }

  // クリエイター一覧を取得
  let query = supabase
    .from('creator_profiles')
    .select('id, user_id, bio, status, call_ok, is_r18_ok, is_commercial_ok, is_urgent_ok, created_at', { count: 'exact' })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }
  if (r18Filter) {
    query = query.eq('is_r18_ok', true)
  }
  if (commercialFilter) {
    query = query.eq('is_commercial_ok', true)
  }
  if (urgentFilter) {
    query = query.eq('is_urgent_ok', true)
  }
  if (blockedIds.length > 0) {
    query = query.not('user_id', 'in', `(${blockedIds.join(',')})`)
  }

  // タグフィルター（OR検索：指定タグのいずれかを持つクリエイター）
  if (tagFilter.length > 0) {
    const { data: taggedCreators } = await supabase
      .from('creator_tags')
      .select('creator_id')
      .in('tag_id', tagFilter)

    const taggedCreatorIds = [...new Set((taggedCreators || []).map((tc) => tc.creator_id))]
    if (taggedCreatorIds.length > 0) {
      query = query.in('id', taggedCreatorIds)
    } else {
      // タグに一致するクリエイターがいない場合は空を返す
      query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
    }
  }

  // 職種フィルター（UUIDならサブカテゴリ、それ以外はカテゴリ名として扱う）
  if (specialtyFilter) {
    const isUuid = /^[0-9a-f]{8}-/.test(specialtyFilter)
    let specialtyIds: string[] = []

    if (isUuid) {
      specialtyIds = [specialtyFilter]
    } else {
      // カテゴリ名で全サブカテゴリを取得
      const { data: catSpecs } = await supabase
        .from('specialties')
        .select('id')
        .eq('category', specialtyFilter)
      specialtyIds = (catSpecs || []).map((s) => s.id)
    }

    if (specialtyIds.length > 0) {
      const { data: specialtyCreators } = await supabase
        .from('creator_specialties')
        .select('creator_id')
        .in('specialty_id', specialtyIds)

      const specialtyCreatorIds = [...new Set((specialtyCreators || []).map((sc) => sc.creator_id))]
      if (specialtyCreatorIds.length > 0) {
        query = query.in('id', specialtyCreatorIds)
      } else {
        query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
      }
    }
  }

  // イベントフィルター
  if (eventFilter) {
    const { data: eventUsers } = await supabase
      .from('user_events')
      .select('user_id')
      .eq('event_id', eventFilter)

    const eventUserIds = (eventUsers || []).map((eu) => eu.user_id)
    if (eventUserIds.length > 0) {
      query = query.in('user_id', eventUserIds)
    } else {
      query = query.in('user_id', ['00000000-0000-0000-0000-000000000000'])
    }
  }

  // ページネーション
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const { data: creators, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / PER_PAGE)

  // プロフィール情報を取得して結合
  const userIds = (creators || []).map((c) => c.user_id)
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds)
        .is('deleted_at', null)
    : { data: [] }

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]))

  // 直近30日以内にBOOSTされたクリエイターを取得
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentBoosts } = userIds.length > 0
    ? await supabase
        .from('boosts')
        .select('receiver_id')
        .in('receiver_id', userIds)
        .gte('created_at', thirtyDaysAgo)
    : { data: [] }
  const boostedIds = new Set((recentBoosts || []).map((b) => b.receiver_id))

  // クリエイターのタグを取得
  const creatorIds = (creators || []).map((c) => c.id).filter(Boolean)
  const { data: creatorTagsData } = creatorIds.length > 0
    ? await supabase
        .from('creator_tags')
        .select('creator_id, tags(name)')
        .in('creator_id', creatorIds)
    : { data: [] }

  const creatorTagMap = new Map<string, string[]>()
  for (const ct of creatorTagsData || []) {
    const tags = creatorTagMap.get(ct.creator_id) || []
    const tagData = ct as unknown as { creator_id: string; tags: { name: string } }
    tags.push(tagData.tags.name)
    creatorTagMap.set(ct.creator_id, tags)
  }

  // 最低単価を取得
  const { data: priceMenusData } = creatorIds.length > 0
    ? await supabase
        .from('price_menus')
        .select('creator_id, price')
        .in('creator_id', creatorIds)
        .not('price', 'is', null)
        .gt('price', 0)
    : { data: [] }

  const minPriceMap = new Map<string, number>()
  for (const pm of priceMenusData || []) {
    const current = minPriceMap.get(pm.creator_id)
    if (current === undefined || pm.price < current) {
      minPriceMap.set(pm.creator_id, pm.price)
    }
  }

  // 当日BOOSTされたクリエイターを取得
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { data: todayBoosts } = userIds.length > 0
    ? await supabase
        .from('boosts')
        .select('receiver_id')
        .in('receiver_id', userIds)
        .gte('created_at', todayStart.toISOString())
    : { data: [] }
  const todayBoostedIds = new Set((todayBoosts || []).map((b) => b.receiver_id))

  const creatorList = (creators || [])
    .map((c) => {
      const profile = profileMap.get(c.user_id)
      if (!profile) return null
      return {
        user_id: c.user_id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: c.bio,
        status: c.status,
        call_ok: c.call_ok,
        is_r18_ok: c.is_r18_ok,
        is_commercial_ok: c.is_commercial_ok,
        is_urgent_ok: c.is_urgent_ok,
        created_at: c.created_at,
        isBoosted: boostedIds.has(c.user_id),
        isTodayBoosted: todayBoostedIds.has(c.user_id),
        tags: creatorTagMap.get(c.id) || [],
        minPrice: minPriceMap.get(c.id) ?? null,
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)

  // ¥3,000未満のクリエイターを下位に
  const isLowPrice = (c: (typeof creatorList)[0]) => c.minPrice !== null && c.minPrice < 3000

  // 当日BOOSTされたクリエイターをランダム表示→その他は新着順→¥3,000未満は末尾
  const todayBoosted = creatorList.filter((c) => c.isTodayBoosted && !isLowPrice(c))
  const normal = creatorList.filter((c) => !c.isTodayBoosted && !isLowPrice(c))
  const lowPrice = creatorList.filter((c) => isLowPrice(c))

  // シャッフル（Fisher-Yates）
  for (let i = todayBoosted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [todayBoosted[i], todayBoosted[j]] = [todayBoosted[j], todayBoosted[i]]
  }

  const sortedCreatorList = [...todayBoosted, ...normal, ...lowPrice]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          クリエイター一覧
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {count ?? 0}人のクリエイター
        </p>

        {/* フィルター */}
        <div className="mt-6">
          <CreatorFilters allTags={allTags} allEvents={allEvents} allSpecialties={allSpecialties} />
        </div>

        {/* 一覧 */}
        {sortedCreatorList.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {sortedCreatorList.map((creator) => (
              <CreatorCard key={creator.user_id} creator={creator} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center text-sm text-zinc-400">
            条件に合うクリエイターが見つかりませんでした
          </div>
        )}

        {/* ページネーション */}
        <div className="mt-8">
          <Pagination currentPage={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  )
}
