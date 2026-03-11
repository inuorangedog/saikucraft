'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { toggleCreatorStatus } from '../actions'

type CreatorProfile = {
  bio: string | null
  status: string
  call_ok: string
  max_revisions: number
  is_r18_ok: boolean
  is_commercial_ok: boolean
  is_urgent_ok: boolean
}

type Transaction = {
  id: string
  status: string
  amount: number
  created_at: string
}

type Application = {
  id: string
  listingId: string
  listingTitle: string
  status: string
  createdAt: string
}

type Props = {
  creatorProfile: CreatorProfile | null
  onStatusChange: (newStatus: string) => void
  transactions: Transaction[]
  monthlyRevenue: number
  applications: Application[]
}

export default function CreatorDashboard({ creatorProfile, onStatusChange, transactions, monthlyRevenue, applications }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleToggleStatus = () => {
    startTransition(async () => {
      const result = await toggleCreatorStatus()
      if ('status' in result) {
        onStatusChange(result.status as string)
      }
    })
  }

  if (!creatorProfile) {
    return (
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950">
        <p className="text-sm text-orange-700 dark:text-orange-300">
          クリエイタープロフィールがまだ設定されていません。
        </p>
        <Link
          href="/dashboard/profile"
          className="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          プロフィールを設定する
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 受注ステータス */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">受注ステータス</p>
          <p className={`text-lg font-bold ${
            creatorProfile.status === '受付中'
              ? 'text-green-600 dark:text-green-400'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}>
            {creatorProfile.status}
          </p>
        </div>
        <button
          onClick={handleToggleStatus}
          disabled={isPending}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            creatorProfile.status === '受付中'
              ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isPending ? '...' : creatorProfile.status === '受付中' ? '受付を停止' : '受付を開始'}
        </button>
      </div>

      {/* 設定情報 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">通話</p>
          <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">{creatorProfile.call_ok}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">修正上限</p>
          <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">{creatorProfile.max_revisions}回</p>
        </div>
      </div>

      {/* フラグ */}
      <div className="flex flex-wrap gap-2">
        {creatorProfile.is_r18_ok && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">R18可</span>
        )}
        {creatorProfile.is_commercial_ok && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">商業可</span>
        )}
        {creatorProfile.is_urgent_ok && (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">急ぎ対応可</span>
        )}
      </div>

      {/* Stripe Connect */}
      <Link
        href="/dashboard/stripe"
        className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">報酬の受け取り設定</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Stripe Connectで銀行口座を登録</p>
        </div>
        <span className="text-zinc-400">→</span>
      </Link>

      {/* ポートフォリオ管理 */}
      <Link
        href="/dashboard/portfolio"
        className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">ポートフォリオ管理</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">作品を追加・編集して公開</p>
        </div>
        <span className="text-zinc-400">→</span>
      </Link>

      {/* 料金メニュー管理 */}
      <Link
        href="/dashboard/price-menu"
        className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">料金メニュー管理</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">料金表を設定してプロフィールに公開</p>
        </div>
        <span className="text-zinc-400">→</span>
      </Link>

      {/* 交渉・取引一覧 */}
      <Link
        href="/dashboard/negotiations"
        className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">交渉・取引一覧</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">指名依頼の交渉と受注中の取引を確認</p>
        </div>
        <span className="text-zinc-400">→</span>
      </Link>

      {/* 収益 */}
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">今月の収益（手数料控除後）</h3>
        <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">¥{monthlyRevenue.toLocaleString()}</p>
      </div>

      {/* 応募した募集 */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">応募した募集</h3>
          <Link href="/listings" className="text-xs text-orange-500 hover:text-orange-600">募集を探す</Link>
        </div>
        {applications.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">応募した募集はありません</p>
        ) : (
          <div className="mt-2 space-y-2">
            {applications.map((app) => {
              const badgeStyle =
                app.status === '応募中' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : app.status === '採用' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
              return (
                <Link
                  key={app.id}
                  href={`/listings/${app.listingId}`}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-1">{app.listingTitle}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(app.createdAt).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle}`}>
                    {app.status}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* 受注中の取引 */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">受注中の取引</h3>
        {transactions.filter((t) => t.status !== '完了').length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">進行中の取引はありません</p>
        ) : (
          <div className="mt-2 space-y-2">
            {transactions.filter((t) => t.status !== '完了').map((tx) => (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">¥{tx.amount.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(tx.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  {tx.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
