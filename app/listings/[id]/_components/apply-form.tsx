'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { applyToListing, withdrawApplication } from '../../application-actions'

type Props = {
  listingId: string
  existingApplication: { id: string; status: string } | null
  isCreator: boolean
  transactionId?: string | null
}

export default function ApplyForm({ listingId, existingApplication, isCreator, transactionId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [applied, setApplied] = useState(!!existingApplication)
  const [appStatus, setAppStatus] = useState(existingApplication?.status || '')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    message: '',
    portfolioUrl: '',
  })

  if (!isCreator) return null

  if (applied) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {appStatus === '応募中' ? '応募済み' : appStatus === '採用' ? '採用されました！' : appStatus === '不採用' ? '見送りとなりました' : '辞退済み'}
            </p>
            {appStatus === '応募中' && (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">依頼者からの返答をお待ちください</p>
            )}
            {appStatus === '採用' && transactionId && (
              <Link
                href={`/transactions/${transactionId}`}
                className="mt-2 inline-block rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                取引画面へ
              </Link>
            )}
          </div>
          {appStatus === '応募中' && existingApplication && (
            <button
              onClick={() => {
                startTransition(async () => {
                  const result = await withdrawApplication(existingApplication.id)
                  if ('success' in result) {
                    setAppStatus('辞退')
                  }
                })
              }}
              disabled={isPending}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            >
              辞退する
            </button>
          )}
        </div>
      </div>
    )
  }

  const handleApply = () => {
    setError('')
    startTransition(async () => {
      const result = await applyToListing(listingId, {
        message: form.message,
        portfolioUrl: form.portfolioUrl || null,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        setApplied(true)
        setAppStatus('応募中')
        setShowForm(false)
      }
    })
  }

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg bg-orange-500 py-3 text-sm font-medium text-white hover:bg-orange-600"
        >
          この募集に応募する
        </button>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">応募フォーム</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-sm text-zinc-700 dark:text-zinc-300">メッセージ</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="自己PR・対応可能な内容など"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-700 dark:text-zinc-300">ポートフォリオURL</label>
              <input
                type="url"
                value={form.portfolioUrl}
                onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="https://pixiv.net/users/... など"
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleApply}
                disabled={isPending || !form.message.trim()}
                className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {isPending ? '送信中...' : '応募する'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
