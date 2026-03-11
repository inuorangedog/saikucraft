'use client'

import { useState, useTransition } from 'react'
import { submitReport } from './report-action'

type Props = {
  targetType: 'profile' | 'listing' | 'transaction' | 'message'
  targetId: string
}

const REASONS = [
  { value: 'ai_suspicion', label: 'AI生成物の疑い' },
  { value: 'inappropriate', label: '不適切なコンテンツ' },
  { value: 'harassment', label: 'ハラスメント・嫌がらせ' },
  { value: 'fraud', label: '詐欺・虚偽の疑い' },
  { value: 'spam', label: 'スパム' },
  { value: 'other', label: 'その他' },
]

export default function ReportButton({ targetType, targetId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!reason) return
    startTransition(async () => {
      const result = await submitReport({ targetType, targetId, reason, detail })
      if ('error' in result) {
        setError(result.error)
      } else {
        setDone(true)
      }
    })
  }

  if (done) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400">通報を受け付けました。ご協力ありがとうございます。</p>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
      >
        通報する
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">通報</h3>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      <div className="mt-3 space-y-2">
        {REASONS.map((r) => (
          <label key={r.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reason"
              value={r.value}
              checked={reason === r.value}
              onChange={(e) => setReason(e.target.value)}
              className="h-4 w-4 text-red-500 focus:ring-red-500"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{r.label}</span>
          </label>
        ))}
      </div>

      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="詳細（任意）"
        rows={3}
        className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setIsOpen(false)}
          className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400"
        >
          キャンセル
        </button>
        <button
          onClick={handleSubmit}
          disabled={!reason || isPending}
          className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          {isPending ? '送信中...' : '通報する'}
        </button>
      </div>
    </div>
  )
}
