'use client'

import { useState, useTransition } from 'react'
import { resolveDispute } from '../actions'

type Dispute = {
  id: string
  status: string
  amount: number
  created_at: string
  deadline: string | null
  payment_status: string
  creator_id: string
  client_id: string
  creator_name: string
  client_name: string
}

type Props = {
  disputes: Dispute[]
}

export default function DisputeList({ disputes: initial }: Props) {
  const [disputes, setDisputes] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resolution, setResolution] = useState<'refund_full' | 'refund_half' | 'complete' | 'cancel'>('refund_full')
  const [adminNote, setAdminNote] = useState('')

  const handleResolve = (disputeId: string) => {
    startTransition(async () => {
      const result = await resolveDispute(disputeId, resolution, adminNote || undefined)
      if ('success' in result) {
        setDisputes((prev) => prev.filter((d) => d.id !== disputeId))
        setExpandedId(null)
        setAdminNote('')
      }
    })
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{disputes.length}件の異議申し立て</p>

      {disputes.map((d) => (
        <div key={d.id} className="rounded-lg border border-red-200 bg-white p-4 dark:border-red-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                取引 #{d.id.slice(0, 8)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {d.client_name}（依頼者） → {d.creator_name}（クリエイター）
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                ¥{d.amount.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {new Date(d.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            {d.deadline && <span>納期: {d.deadline}</span>}
            <span>決済: {d.payment_status}</span>
            <a
              href={`/transactions/${d.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600"
            >
              取引を確認
            </a>
          </div>

          {expandedId === d.id ? (
            <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">対応方針</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as typeof resolution)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="refund_full">全額返金（依頼者へ返金）</option>
                  <option value="refund_half">50%返金（依頼者へ半額返金）</option>
                  <option value="complete">取引完了（クリエイターへ送金）</option>
                  <option value="cancel">キャンセル（返金なし・取引終了）</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">管理者メモ（任意）</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  placeholder="対応理由など..."
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setExpandedId(null)}
                  className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleResolve(d.id)}
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:bg-zinc-300"
                >
                  {isPending ? '処理中...' : '対応を実行'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setExpandedId(d.id)}
              className="mt-3 w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300"
            >
              対応する
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
