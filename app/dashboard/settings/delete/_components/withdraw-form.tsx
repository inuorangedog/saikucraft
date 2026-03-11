'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { withdrawAccount } from '../actions'
import { createClient } from '@/app/lib/supabase'

type Props = {
  canWithdraw: boolean
  activeTransactionCount: number
}

export default function WithdrawForm({ canWithdraw, activeTransactionCount }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<'info' | 'confirm'>(canWithdraw ? 'info' : 'info')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  const handleWithdraw = () => {
    if (confirmText !== '退会する') return

    startTransition(async () => {
      setError('')
      const result = await withdrawAccount()
      if ('error' in result) {
        setError(result.error)
        return
      }

      // サインアウトしてトップページへ
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/'
    })
  }

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {!canWithdraw && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="font-medium text-red-700 dark:text-red-300">退会できません</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            進行中の取引が{activeTransactionCount}件あります。すべての取引を完了またはキャンセルしてから退会してください。
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            ダッシュボードに戻る
          </button>
        </div>
      )}

      {canWithdraw && step === 'info' && (
        <>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">退会すると以下の処理が行われます</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-2">
                <span className="text-red-500">×</span>
                プロフィール情報が匿名化されます
              </li>
              <li className="flex gap-2">
                <span className="text-red-500">×</span>
                ポートフォリオ作品が削除されます
              </li>
              <li className="flex gap-2">
                <span className="text-red-500">×</span>
                公開中の募集が締め切られます
              </li>
              <li className="flex gap-2">
                <span className="text-red-500">×</span>
                お気に入り・イベント・タグ紐付けが削除されます
              </li>
              <li className="flex gap-2">
                <span className="text-red-500">×</span>
                アカウントにログインできなくなります
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-400">-</span>
                過去のメッセージ履歴はDB上に保持されます
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-400">-</span>
                画像ファイルは30日後に自動削除されます
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              この操作は取り消せません。退会後にアカウントを復旧することはできません。
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              戻る
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600"
            >
              退会手続きへ進む
            </button>
          </div>
        </>
      )}

      {canWithdraw && step === 'confirm' && (
        <>
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-5 dark:border-red-700 dark:bg-red-950">
            <p className="font-bold text-red-700 dark:text-red-300">最終確認</p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              本当に退会しますか？確認のため「退会する」と入力してください。
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="退会する"
              className="mt-3 w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none dark:border-red-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('info'); setConfirmText('') }}
              className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              やめる
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isPending || confirmText !== '退会する'}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
            >
              {isPending ? '処理中...' : '退会する'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
