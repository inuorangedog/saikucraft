import { notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import Link from 'next/link'
import ReportButton from '@/app/_components/report-button'
import BlockButton from '@/app/_components/block-button'
import { getClientStats } from '@/app/lib/stats'
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
    title: profile ? profile.username : 'ユーザー',
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, user_type, created_at')
    .eq('user_id', id)
    .is('deleted_at', null)
    .single()

  if (!profile) notFound()

  // クリエイタープロフィールがあればそちらにリダイレクト案内
  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', id)
    .single()

  // 依頼者統計
  const stats = await getClientStats(id)

  // ログインユーザー情報
  const { data: { user } } = await supabase.auth.getUser()
  let isBlocked = false
  if (user && user.id !== id) {
    const { data: block } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', id)
      .single()
    isBlocked = !!block
  }

  // 公開済み完了取引のタイトル一覧
  const { data: completedListings } = await supabase
    .from('transactions')
    .select('id, listing_id, listings(title)')
    .eq('client_id', id)
    .eq('status', '完了')
    .order('created_at', { ascending: false })
    .limit(10)

  const registeredDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
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
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              依頼者 · 登録{registeredDays}日目
            </p>
          </div>
        </div>

        {/* クリエイターページへのリンク */}
        {creatorProfile && (
          <Link
            href={`/creators/${id}`}
            className="mt-4 block rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
          >
            クリエイターとしてのプロフィールを見る →
          </Link>
        )}

        {/* 依頼者統計 */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">総依頼</p>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{stats.totalOrders}件</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">キャンセル率</p>
            <p className={`mt-1 text-lg font-bold ${stats.cancelRate <= 10 ? 'text-green-600 dark:text-green-400' : stats.cancelRate >= 30 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
              {stats.totalOrders > 0 ? `${stats.cancelRate}%` : '-'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">返信平均</p>
            <p className={`mt-1 text-lg font-bold ${stats.replyDays !== null && stats.replyDays <= 1 ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
              {stats.replyDays !== null ? `${stats.replyDays}日` : '-'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">BOOST送信</p>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{stats.boostSent}回</p>
          </div>
        </div>

        {/* 過去の依頼 */}
        {completedListings && completedListings.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">完了した依頼</h2>
            <div className="mt-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {completedListings.map((tx, i) => {
                const listing = tx as unknown as { id: string; listing_id: string; listings: { title: string } | null }
                return (
                  <div
                    key={tx.id}
                    className={`px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 ${
                      i > 0 ? 'border-t border-zinc-200 dark:border-zinc-700' : ''
                    }`}
                  >
                    {listing.listings?.title || '依頼（タイトルなし）'}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* アクション */}
        {user && user.id !== id && (
          <div className="mt-6 flex items-center gap-3">
            <BlockButton targetId={id} initialBlocked={isBlocked} />
            <ReportButton targetType="profile" targetId={id} />
          </div>
        )}
      </div>
    </div>
  )
}
