import Link from 'next/link'
import { createClient } from '@/app/lib/supabase-server'
import ListingCard from './_components/listing-card'
import ListingFilters from './_components/listing-filters'
import Pagination from '@/app/_components/pagination'
import { getAllTags } from '@/app/lib/tags'
import { getUpcomingEvents } from '@/app/lib/events'
import { getAllSpecialties } from '@/app/lib/specialties'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '募集一覧',
  description: 'イラスト・デザインの募集案件を探しましょう。手描きクリエイターのスキルを求める依頼一覧です。',
  openGraph: {
    title: '募集一覧',
    description: 'イラスト・デザインの募集案件を探しましょう。',
  },
}

const PER_PAGE = 12

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function ListingsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1'))
  const statusFilter = params.status || ''
  const sort = params.sort || ''
  const tagFilter = params.tags?.split(',').filter(Boolean) || []
  const eventFilter = params.event || ''
  const budgetMin = params.budget_min ? parseInt(params.budget_min) : null
  const budgetMax = params.budget_max ? parseInt(params.budget_max) : null
  const specialtyFilter = params.specialty || ''

  const supabase = await createClient()
  const allTags = await getAllTags()
  const allEvents = await getUpcomingEvents()
  const allSpecialties = await getAllSpecialties()

  let query = supabase
    .from('listings')
    .select('id, client_id, title, budget, headcount, deadline, application_deadline, status, created_at', { count: 'exact' })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  // タグフィルター
  if (tagFilter.length > 0) {
    const { data: taggedListings } = await supabase
      .from('listing_tags')
      .select('listing_id')
      .in('tag_id', tagFilter)

    const taggedIds = [...new Set((taggedListings || []).map((tl) => tl.listing_id))]
    if (taggedIds.length > 0) {
      query = query.in('id', taggedIds)
    } else {
      query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
    }
  }

  // 予算フィルター
  if (budgetMin !== null) {
    query = query.gte('budget', budgetMin)
  }
  if (budgetMax !== null) {
    query = query.lte('budget', budgetMax)
  }

  // 職種フィルター（UUIDならサブカテゴリ、それ以外はカテゴリ名として扱う）
  if (specialtyFilter) {
    const isUuid = /^[0-9a-f]{8}-/.test(specialtyFilter)
    let specIds: string[] = []

    if (isUuid) {
      specIds = [specialtyFilter]
    } else {
      const { data: catSpecs } = await supabase
        .from('specialties')
        .select('id')
        .eq('category', specialtyFilter)
      specIds = (catSpecs || []).map((s) => s.id)
    }

    if (specIds.length > 0) {
      const { data: specialtyListings } = await supabase
        .from('listing_specialties')
        .select('listing_id')
        .in('specialty_id', specIds)

      const matchedIds = [...new Set((specialtyListings || []).map((sl) => sl.listing_id))]
      if (matchedIds.length > 0) {
        query = query.in('id', matchedIds)
      } else {
        query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
      }
    }
  }

  // イベントフィルター
  if (eventFilter) {
    query = query.eq('event_id', eventFilter)
  }

  // 並び順
  if (sort === 'deadline') {
    query = query.not('application_deadline', 'is', null).order('application_deadline', { ascending: true })
  } else if (sort === 'budget_high') {
    query = query.not('budget', 'is', null).order('budget', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const { data: listings, count } = await query.range(from, to)
  const totalPages = Math.ceil((count || 0) / PER_PAGE)

  // クライアント名を取得
  const clientIds = [...new Set((listings || []).map((l) => l.client_id))]
  const { data: profiles } = clientIds.length > 0
    ? await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', clientIds)
    : { data: [] }

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.username]))

  // タグを取得
  const listingIds = (listings || []).map((l) => l.id)
  const { data: listingTagsData } = listingIds.length > 0
    ? await supabase
        .from('listing_tags')
        .select('listing_id, tags(name)')
        .in('listing_id', listingIds)
    : { data: [] }

  const listingTagMap = new Map<string, string[]>()
  for (const lt of listingTagsData || []) {
    const tags = listingTagMap.get(lt.listing_id) || []
    const tagData = lt as unknown as { listing_id: string; tags: { name: string } }
    tags.push(tagData.tags.name)
    listingTagMap.set(lt.listing_id, tags)
  }

  // 職種を取得
  const { data: listingSpecsData } = listingIds.length > 0
    ? await supabase
        .from('listing_specialties')
        .select('listing_id, specialties(name)')
        .in('listing_id', listingIds)
    : { data: [] }

  const listingSpecMap = new Map<string, string[]>()
  for (const ls of listingSpecsData || []) {
    const specs = listingSpecMap.get(ls.listing_id) || []
    const specData = ls as unknown as { listing_id: string; specialties: { name: string } }
    specs.push(specData.specialties.name)
    listingSpecMap.set(ls.listing_id, specs)
  }

  const listingList = (listings || []).map((l) => ({
    ...l,
    client_username: profileMap.get(l.client_id) || '不明',
    tags: listingTagMap.get(l.id) || [],
    specialties: listingSpecMap.get(l.id) || [],
  }))

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              募集一覧
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {count ?? 0}件の募集
            </p>
          </div>
          <Link
            href="/listings/new"
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            募集を作成
          </Link>
        </div>

        <div className="mt-6">
          <ListingFilters allTags={allTags} allEvents={allEvents} allSpecialties={allSpecialties} />
        </div>

        {listingList.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {listingList.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center text-sm text-zinc-400">
            条件に合う募集が見つかりませんでした
          </div>
        )}

        <div className="mt-8">
          <Pagination currentPage={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  )
}
