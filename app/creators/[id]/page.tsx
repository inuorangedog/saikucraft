import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import Link from 'next/link'
import ReportButton from '@/app/_components/report-button'
import FavoriteButton from '@/app/_components/favorite-button'
import BlockButton from '@/app/_components/block-button'
import { getCreatorTags } from '@/app/lib/tags'
import { getCreatorReplyDays } from '@/app/lib/stats'
import MarkdownBio from '@/app/_components/markdown-bio'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', id)
    .is('deleted_at', null)
    .single()

  return {
    title: profile ? profile.username : 'クリエイター',
    description: profile ? `${profile.username}のクリエイタープロフィール。SaikuCraftで手描き作品を依頼しましょう。` : undefined,
    openGraph: profile ? {
      title: `${profile.username} - クリエイター`,
      description: `${profile.username}のクリエイタープロフィール`,
    } : undefined,
  }
}

export default async function CreatorProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, user_type')
    .eq('user_id', id)
    .is('deleted_at', null)
    .single()

  if (!profile) notFound()

  const { data: creator } = await supabase
    .from('creator_profiles')
    .select('bio, status, call_ok, max_revisions, ng_content, is_r18_ok, is_commercial_ok, is_urgent_ok, twitter_url, pixiv_url, misskey_url')
    .eq('user_id', id)
    .single()

  if (!creator) notFound()

  // 実績データを取得
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('id, status, deadline, delivered_at, created_at')
    .eq('creator_id', id)

  const txList = allTransactions || []
  const totalTx = txList.length
  const completedTx = txList.filter((t) => t.status === '完了')
  const deliveryRate = totalTx > 0 ? Math.round((completedTx.length / totalTx) * 100) : 0

  // 締め切り厳守率（納品日が締め切り以内）
  const txWithDeadline = completedTx.filter((t) => t.deadline && t.delivered_at)
  const onTimeTx = txWithDeadline.filter((t) => new Date(t.delivered_at!) <= new Date(t.deadline! + 'T23:59:59'))
  const onTimeRate = txWithDeadline.length > 0 ? Math.round((onTimeTx.length / txWithDeadline.length) * 100) : 0

  // 返信平均日数
  const replyDays = await getCreatorReplyDays(id)

  // BOOST受信数（直近30日）
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count: boostCount } = await supabase
    .from('boosts')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', id)
    .gte('created_at', thirtyDaysAgo)

  // ログインユーザーのお気に入り状態を確認
  const { data: { user } } = await supabase.auth.getUser()
  let isFavorited = false
  let isBlocked = false
  if (user) {
    const { data: fav } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('creator_id', id)
      .single()
    isFavorited = !!fav

    const { data: block } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', id)
      .single()
    isBlocked = !!block
  }

  // クリエイターのタグを取得
  const creatorTags = await getCreatorTags(id)

  // creator_profiles.id を取得（料金表とポートフォリオで使用）
  const creatorProfileId = (await supabase.from('creator_profiles').select('id').eq('user_id', id).single()).data?.id ?? ''

  // ポートフォリオ
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('id, title, description, image_url, tags, is_r18')
    .eq('creator_id', creatorProfileId)
    .order('sort_order')

  // 料金表
  const { data: priceMenus } = await supabase
    .from('price_menus')
    .select('label, price, price_note, sort_order')
    .eq('creator_id', creatorProfileId)
    .order('sort_order')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              profile.username.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {profile.username}
            </h1>
            <p className={`mt-1 text-sm font-medium ${
              creator.status === '受付中'
                ? 'text-green-600 dark:text-green-400'
                : 'text-zinc-400'
            }`}>
              {creator.status}
            </p>
          </div>
        </div>

        {/* 実績 */}
        {totalTx > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">総取引</p>
              <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{totalTx}件</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">納品達成率</p>
              <p className={`mt-1 text-lg font-bold ${deliveryRate >= 80 ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                {deliveryRate}%
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">締切厳守率</p>
              <p className={`mt-1 text-lg font-bold ${onTimeRate >= 80 ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                {txWithDeadline.length > 0 ? `${onTimeRate}%` : '-'}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">返信平均</p>
              <p className={`mt-1 text-lg font-bold ${replyDays !== null && replyDays <= 1 ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                {replyDays !== null ? `${replyDays}日` : '-'}
              </p>
            </div>
          </div>
        )}

        {/* BOOSTバッジ */}
        {(boostCount ?? 0) > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
            人気クリエイター（直近30日で{boostCount}件のBOOST）
          </div>
        )}

        {/* 自己紹介 */}
        {creator.bio && (
          <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">自己紹介</h2>
            <div className="mt-2">
              <MarkdownBio content={creator.bio} />
            </div>
          </div>
        )}

        {/* 外部リンク */}
        {(creator.twitter_url || creator.pixiv_url || creator.misskey_url) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {creator.twitter_url && (
              <a href={creator.twitter_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                X (Twitter)
              </a>
            )}
            {creator.pixiv_url && (
              <a href={creator.pixiv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                pixiv
              </a>
            )}
            {creator.misskey_url && (
              <a href={creator.misskey_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                Misskey
              </a>
            )}
          </div>
        )}

        {/* 取引条件 */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">通話</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{creator.call_ok}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">修正上限</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{creator.max_revisions}回</p>
          </div>
        </div>

        {/* 得意タグ */}
        {creatorTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {creatorTags.map((tag) => (
              <span key={tag.id} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* フラグ */}
        <div className="mt-4 flex flex-wrap gap-2">
          {creator.is_r18_ok && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">R18可</span>
          )}
          {creator.is_commercial_ok && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">商業可</span>
          )}
          {creator.is_urgent_ok && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">急ぎ対応可</span>
          )}
        </div>

        {/* NG事項 */}
        {creator.ng_content && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <h2 className="text-sm font-medium text-red-700 dark:text-red-300">NG事項</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-red-600 dark:text-red-400">
              {creator.ng_content}
            </p>
          </div>
        )}

        {/* アクション */}
        <div className="mt-6 space-y-3">
          {user && user.id !== id && !isBlocked && (
            <Link
              href={`/negotiations/new?creator=${id}`}
              className="block w-full rounded-lg bg-orange-500 py-3 text-center text-sm font-medium text-white hover:bg-orange-600"
            >
              このクリエイターに依頼する
            </Link>
          )}
          <div className="flex items-center gap-3">
            {user && user.id !== id && (
              <>
                <FavoriteButton creatorId={id} initialFavorited={isFavorited} />
                <BlockButton targetId={id} initialBlocked={isBlocked} />
              </>
            )}
            <ReportButton targetType="profile" targetId={id} />
          </div>
        </div>

        {/* ポートフォリオ */}
        {portfolios && portfolios.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">ポートフォリオ</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {portfolios.map((work) => (
                <div key={work.id} className="group relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <div className="aspect-square">
                    <img src={work.image_url} alt={work.title} className="h-full w-full object-cover" />
                  </div>
                  {work.is_r18 && (
                    <span className="absolute left-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-xs font-medium text-white">R18</span>
                  )}
                  <div className="p-2">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{work.title}</p>
                    {work.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{work.description}</p>
                    )}
                    {work.tags && work.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {work.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 料金表 */}
        {priceMenus && priceMenus.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">料金表</h2>
            <div className="mt-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {priceMenus.map((menu, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i > 0 ? 'border-t border-zinc-200 dark:border-zinc-700' : ''
                  }`}
                >
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{menu.label}</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {menu.price ? `¥${menu.price.toLocaleString()}` : ''}{menu.price_note || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
