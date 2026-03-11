'use client'

import Link from 'next/link'

type Transaction = {
  id: string
  status: string
  amount: number
  created_at: string
}

type Listing = {
  id: string
  title: string
  status: string
  created_at: string
}

type Props = {
  username: string
  transactions: Transaction[]
  listings: Listing[]
  totalPaid: number
}

export default function ClientDashboard({ username, transactions, listings, totalPaid }: Props) {
  const activeTransactions = transactions.filter((t) => t.status !== '完了')

  return (
    <div className="space-y-6">
      {/* 交渉・取引一覧 */}
      <Link
        href="/dashboard/negotiations"
        className="flex items-center justify-between rounded-lg border border-zinc-200 p-6 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">交渉・取引一覧</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">指名依頼の交渉と進行中の取引を確認</p>
        </div>
        <span className="text-zinc-400">→</span>
      </Link>

      {/* 進行中の取引 */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">進行中の取引</h3>
        {activeTransactions.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">進行中の取引はありません</p>
        ) : (
          <div className="mt-2 space-y-2">
            {activeTransactions.map((tx) => (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">¥{tx.amount.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(tx.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {tx.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 募集ページ管理 */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">募集ページ</h3>
          <Link href="/listings/new" className="text-sm text-blue-500 hover:text-blue-600">+ 新規作成</Link>
        </div>
        {listings.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">まだ募集はありません</p>
        ) : (
          <div className="mt-2 space-y-2">
            {listings.map((l) => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750"
              >
                <p className="text-sm text-zinc-900 dark:text-zinc-50">{l.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  l.status === '募集中' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : l.status === '選考中' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>{l.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* お気に入りクリエイター */}
      <Link
        href="/dashboard/favorites"
        className="flex items-center justify-between rounded-lg border border-zinc-200 p-6 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">お気に入りクリエイター</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">お気に入りに追加したクリエイターを確認</p>
        </div>
        <span className="text-zinc-400">→</span>
      </Link>

      {/* 支払い合計 */}
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">支払い合計</h3>
        <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">¥{totalPaid.toLocaleString()}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{transactions.filter((t) => t.status === '完了').length}件の完了取引</p>
      </div>
    </div>
  )
}
