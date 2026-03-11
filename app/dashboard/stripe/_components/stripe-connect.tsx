'use client'

import { useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { createStripeConnectAccount, getStripeDashboardLink } from '../actions'

type Props = {
  hasAccount: boolean
  isOnboarded: boolean
}

export default function StripeConnect({ hasAccount, isOnboarded }: Props) {
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')

  const handleSetup = () => {
    startTransition(async () => {
      const result = await createStripeConnectAccount()
      if ('url' in result) {
        window.location.href = result.url
      }
    })
  }

  const handleDashboard = () => {
    startTransition(async () => {
      const result = await getStripeDashboardLink()
      if ('url' in result) {
        window.open(result.url, '_blank')
      }
    })
  }

  return (
    <div className="mt-6">
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          Stripeアカウントの設定が完了しました。報酬を受け取る準備ができています。
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        {isOnboarded ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">Stripe接続済み</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">報酬の受け取りが可能です</p>
              </div>
            </div>
            <button
              onClick={handleDashboard}
              disabled={isPending}
              className="mt-4 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {isPending ? '読み込み中...' : 'Stripeダッシュボードを開く'}
            </button>
          </>
        ) : hasAccount ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">設定が未完了です</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Stripeで銀行口座の登録を完了してください</p>
              </div>
            </div>
            <button
              onClick={handleSetup}
              disabled={isPending}
              className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {isPending ? '読み込み中...' : '設定を続ける'}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">報酬受け取りの設定</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Stripeを通じて安全に報酬を受け取ることができます。銀行口座の登録は1回のみです。
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
              <li>・ 取引完了後、自動で銀行口座に振り込まれます</li>
              <li>・ プラットフォーム手数料: 7%</li>
              <li>・ 個人情報はStripeが安全に管理します</li>
            </ul>
            <button
              onClick={handleSetup}
              disabled={isPending}
              className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {isPending ? '読み込み中...' : 'Stripeアカウントを設定する'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
