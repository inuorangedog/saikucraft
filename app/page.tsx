import Link from 'next/link'
import { createClient } from '@/app/lib/supabase-server'
import CreatorCard from './creators/_components/creator-card'
import ListingCard from './listings/_components/listing-card'
import { getUpcomingEvents } from '@/app/lib/events'
import { getShowcases } from '@/app/showcase/actions'

export default async function HomePage() {
  const supabase = await createClient()

  // 新着クリエイター（最大4件）
  const { data: creators } = await supabase
    .from('creator_profiles')
    .select('user_id, bio, status, call_ok, is_r18_ok, is_commercial_ok, is_urgent_ok, created_at')
    .order('created_at', { ascending: false })
    .limit(4)

  const creatorUserIds = (creators || []).map((c) => c.user_id)
  const { data: creatorProfiles } = creatorUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', creatorUserIds)
        .is('deleted_at', null)
    : { data: [] }

  const profileMap = new Map((creatorProfiles || []).map((p) => [p.user_id, p]))
  const creatorList = (creators || [])
    .map((c) => {
      const p = profileMap.get(c.user_id)
      if (!p) return null
      return { ...c, username: p.username, avatar_url: p.avatar_url }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)

  // 新着募集（最大4件）
  const { data: listings } = await supabase
    .from('listings')
    .select('id, client_id, title, budget, headcount, deadline, application_deadline, status, created_at')
    .eq('status', '募集中')
    .order('created_at', { ascending: false })
    .limit(4)

  const clientIds = [...new Set((listings || []).map((l) => l.client_id))]
  const { data: clientProfiles } = clientIds.length > 0
    ? await supabase.from('profiles').select('user_id, username').in('user_id', clientIds)
    : { data: [] }

  const clientMap = new Map((clientProfiles || []).map((p) => [p.user_id, p.username]))
  const listingList = (listings || []).map((l) => ({
    ...l,
    client_username: clientMap.get(l.client_id) || '不明',
  }))

  // イベントピックアップ
  const upcomingEvents = await getUpcomingEvents()
  const eventsWithCountdown = upcomingEvents
    .filter((e) => !e.is_permanent && e.date)
    .map((e) => {
      const daysLeft = Math.ceil((new Date(e.date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return { ...e, daysLeft }
    })
    .filter((e) => e.daysLeft > 0)
    .slice(0, 4)

  // イベントごとの急ぎ対応可クリエイター・案件を取得
  const eventDetails = await Promise.all(
    eventsWithCountdown.map(async (event) => {
      // 急ぎ対応可クリエイター（最大4人）
      const { data: eventCreatorIds } = await supabase
        .from('user_events')
        .select('user_id')
        .eq('event_id', event.id)

      let urgentCreators: { username: string; avatar_url: string | null }[] = []
      if (eventCreatorIds && eventCreatorIds.length > 0) {
        const userIds = eventCreatorIds.map((e) => e.user_id)
        const { data: uc } = await supabase
          .from('creator_profiles')
          .select('user_id')
          .in('user_id', userIds)
          .eq('is_urgent_ok', true)
          .eq('status', '受付中')
          .limit(4)

        if (uc && uc.length > 0) {
          const { data: ucProfiles } = await supabase
            .from('profiles')
            .select('user_id, username, avatar_url')
            .in('user_id', uc.map((c) => c.user_id))
            .is('deleted_at', null)
          urgentCreators = (ucProfiles || []).map((p) => ({
            username: p.username,
            avatar_url: p.avatar_url,
          }))
        }
      }

      // 急ぎ募集中の案件（最大3件）
      const { data: eventListings } = await supabase
        .from('listings')
        .select('id, title, budget')
        .eq('event_id', event.id)
        .eq('status', '募集中')
        .order('created_at', { ascending: false })
        .limit(3)

      return {
        ...event,
        urgentCreators,
        eventListings: eventListings || [],
      }
    })
  )

  // ショーケース
  const showcaseItems = await getShowcases(8)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SaikuCraft',
    description: '手描きクリエイターと安心して繋がれる同人特化のコミッションサービス',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://saikucraft.com',
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-b from-orange-50 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            あなたの世界を、
            <br />
            <span className="text-orange-500">届ける人がいる。</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            SaikuCraftは、手描きクリエイターと安心して繋がれる
            <br className="hidden sm:block" />
            同人特化のコミッションサービスです。
          </p>

          {/* バッジ */}
          <div className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-3">
            <span className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 dark:border-orange-800 dark:bg-zinc-900 dark:text-orange-300">
              AI使用禁止
            </span>
            <span className="rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-zinc-900 dark:text-green-300">
              エスクロー決済で安心
            </span>
            <span className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-zinc-900 dark:text-blue-300">
              手数料7%のみ
            </span>
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-lg bg-orange-500 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-orange-600"
            >
              無料で始める
            </Link>
            <Link
              href="/about"
              className="rounded-lg border border-zinc-300 px-8 py-3 text-base font-medium text-zinc-700 hover:bg-white dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              サービスについて詳しく見る
            </Link>
          </div>
        </div>
      </section>

      {/* イベントピックアップ */}
      {eventDetails.length > 0 && (
        <section className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">イベントピックアップ</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">開催が近いイベント</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {eventDetails.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-50">{event.name}</p>
                      {event.date && (
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                          {new Date(event.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                      あと{event.daysLeft}日
                    </span>
                  </div>

                  {/* 急ぎ対応可クリエイター */}
                  {event.urgentCreators.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">急ぎ対応可クリエイター</p>
                      <div className="mt-2 flex items-center gap-2">
                        {event.urgentCreators.map((c, i) => (
                          <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                            {c.avatar_url ? (
                              <img src={c.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              c.username.charAt(0).toUpperCase()
                            )}
                          </div>
                        ))}
                        <Link
                          href={`/creators?event=${event.id}&urgent=true`}
                          className="text-xs text-orange-500 hover:text-orange-600"
                        >
                          もっと見る
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* 募集中の案件 */}
                  {event.eventListings.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">募集中の案件</p>
                      <div className="mt-1.5 space-y-1">
                        {event.eventListings.map((l) => (
                          <Link
                            key={l.id}
                            href={`/listings/${l.id}`}
                            className="block truncate text-sm text-zinc-700 hover:text-orange-500 dark:text-zinc-300"
                          >
                            {l.title}
                            {l.budget && <span className="ml-2 text-xs text-zinc-400">¥{l.budget.toLocaleString()}</span>}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/creators?event=${event.id}`}
                    className="mt-4 block text-center text-sm font-medium text-orange-500 hover:text-orange-600"
                  >
                    クリエイターをもっと見る →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* クリエイター一覧セクション */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">クリエイター</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">手描きで作品を届けるクリエイターたち</p>
            </div>
            <Link href="/creators" className="text-sm font-medium text-orange-500 hover:text-orange-600">
              もっと見る →
            </Link>
          </div>

          {creatorList.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {creatorList.map((creator) => (
                <CreatorCard key={creator.user_id} creator={creator} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-zinc-400">
              まだクリエイターが登録されていません
            </p>
          )}
        </div>
      </section>

      {/* 募集案件セクション */}
      <section className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">募集案件</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">あなたのスキルを求めている依頼</p>
            </div>
            <Link href="/listings" className="text-sm font-medium text-blue-500 hover:text-blue-600">
              もっと見る →
            </Link>
          </div>

          {listingList.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {listingList.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-zinc-400">
              まだ募集がありません
            </p>
          )}
        </div>
      </section>

      {/* ショーケース */}
      {showcaseItems.length > 0 && (
        <section className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">ショーケース</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">クリエイターの納品実績</p>
              </div>
              <Link href="/showcase" className="text-sm font-medium text-orange-500 hover:text-orange-600">
                もっと見る →
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {showcaseItems.map((item) => (
                <div key={item.id} className="group overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                  {/* メディア */}
                  <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {item.media_type === 'image' && (
                      <img
                        src={item.media_url}
                        alt={item.caption || 'ショーケース'}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                    {item.media_type === 'video' && (
                      <video
                        src={item.media_url}
                        muted
                        playsInline
                        onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseOut={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0 }}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {item.media_type === 'audio' && (
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                        <svg className="h-12 w-12 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                        <audio src={item.media_url} controls className="w-full" />
                      </div>
                    )}
                  </div>

                  {/* クリエイター情報 */}
                  <div className="p-3">
                    <Link href={`/creators/${item.creator_id}`} className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                        {item.creator_avatar_url ? (
                          <img src={item.creator_avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          item.creator_username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="truncate text-xs font-medium text-zinc-700 hover:text-orange-500 dark:text-zinc-300">
                        {item.creator_username}
                      </span>
                    </Link>
                    {item.caption && (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* フッター */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm font-medium text-orange-500">SaikuCraft</p>
            <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/about" className="hover:text-zinc-700 dark:hover:text-zinc-200">サービス紹介</Link>
              <Link href="/faq" className="hover:text-zinc-700 dark:hover:text-zinc-200">FAQ</Link>
              <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-200">利用規約</Link>
              <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-200">プライバシーポリシー</Link>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              &copy; 2026 SaikuCraft
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
