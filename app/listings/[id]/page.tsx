import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/app/lib/supabase-server'
import ReportButton from '@/app/_components/report-button'
import ApplyForm from './_components/apply-form'
import ApplicationList from './_components/application-list'
import ListingOwnerActions from './_components/listing-owner-actions'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select('title')
    .eq('id', id)
    .single()

  return {
    title: data ? data.title : '募集詳細',
    description: data ? `「${data.title}」の募集詳細。SaikuCraftで手描きクリエイターを探しましょう。` : undefined,
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('id, client_id, title, description, budget, headcount, deadline, application_deadline, status, created_at')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  // 依頼者名
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('user_id', listing.client_id)
    .single()

  // ログインユーザー情報
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === listing.client_id

  // クリエイターか確認
  let isCreator = false
  let existingApplication: { id: string; status: string } | null = null
  let transactionId: string | null = null
  if (user && !isOwner) {
    const { data: cp } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    isCreator = !!cp

    if (isCreator) {
      const { data: app } = await supabase
        .from('listing_applications')
        .select('id, status')
        .eq('listing_id', listing.id)
        .eq('creator_id', user.id)
        .single()
      existingApplication = app

      // 採用済みなら取引IDを取得
      if (app?.status === '採用') {
        const { data: tx } = await supabase
          .from('transactions')
          .select('id')
          .eq('listing_id', listing.id)
          .eq('creator_id', user.id)
          .single()
        transactionId = tx?.id || null
      }
    }
  }

  // 依頼者の場合: 応募一覧を取得
  let applicationList: { id: string; creator_id: string; creatorName: string; message: string | null; portfolio_url: string | null; status: string; created_at: string; transactionId?: string | null }[] = []
  if (isOwner) {
    const { data: apps } = await supabase
      .from('listing_applications')
      .select('id, creator_id, message, portfolio_url, status, created_at')
      .eq('listing_id', listing.id)
      .order('created_at', { ascending: false })

    if (apps && apps.length > 0) {
      const creatorIds = apps.map((a) => a.creator_id)
      const { data: profiles2 } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', creatorIds)
      const pMap = new Map((profiles2 || []).map((p) => [p.user_id, p.username]))

      // 採用済みの応募者の取引IDを取得
      const acceptedCreatorIds = apps.filter((a) => a.status === '採用').map((a) => a.creator_id)
      let txMap = new Map<string, string>()
      if (acceptedCreatorIds.length > 0) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('id, creator_id')
          .eq('listing_id', listing.id)
          .in('creator_id', acceptedCreatorIds)
        for (const tx of txs || []) {
          txMap.set(tx.creator_id, tx.id)
        }
      }

      applicationList = apps.map((a) => ({
        ...a,
        creatorName: pMap.get(a.creator_id) || '不明',
        transactionId: txMap.get(a.creator_id) || null,
      }))
    }
  }

  const daysLeft = listing.application_deadline
    ? Math.ceil((new Date(listing.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* ステータス */}
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            listing.status === '募集中'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : listing.status === '選考中'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
          }`}>
            {listing.status}
          </span>
          {daysLeft !== null && daysLeft >= 0 && (
            <span className={`text-sm ${daysLeft <= 3 ? 'font-medium text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
              締切まであと{daysLeft}日
            </span>
          )}
        </div>

        {/* タイトル */}
        <h1 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {listing.title}
        </h1>

        {/* 依頼者 */}
        <Link
          href={`/users/${listing.client_id}`}
          className="mt-3 inline-flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              (profile?.username || '?').charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
            {profile?.username || '不明'}
          </span>
        </Link>

        {/* 情報カード */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">予算（1人あたり）</p>
            <p className={`mt-1 text-sm font-medium ${listing.budget === 0 ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
              {listing.budget === 0 ? '無償依頼' : listing.budget ? `¥${listing.budget.toLocaleString()}〜` : '要相談'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">募集人数</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {listing.headcount}人
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">希望納期</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {listing.deadline || '要相談'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">募集締切</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {listing.application_deadline || '無期限'}
            </p>
          </div>
        </div>

        {/* 説明 */}
        {listing.description && (
          <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">詳細</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {listing.description}
            </p>
          </div>
        )}

        {/* クリエイター向け: 応募フォーム */}
        {listing.status === '募集中' && user && !isOwner && (
          <div className="mt-6">
            <ApplyForm
              listingId={listing.id}
              existingApplication={existingApplication}
              isCreator={isCreator}
              transactionId={transactionId}
            />
          </div>
        )}

        {/* 依頼者向け: 管理ボタン */}
        {isOwner && (
          <div className="mt-6">
            <ListingOwnerActions listingId={listing.id} currentStatus={listing.status} />
          </div>
        )}

        {/* 依頼者向け: 応募者一覧 */}
        {isOwner && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              応募者（{applicationList.length}件）
            </h2>
            <ApplicationList applications={applicationList} />
          </div>
        )}

        {/* 投稿日 + 通報 */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            投稿日: {new Date(listing.created_at).toLocaleDateString('ja-JP')}
          </p>
          <ReportButton targetType="listing" targetId={listing.id} />
        </div>
      </div>
    </div>
  )
}
