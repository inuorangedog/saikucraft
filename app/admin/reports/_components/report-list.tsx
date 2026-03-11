'use client'

import { useTransition, useState } from 'react'
import { updateReportStatus } from '../../actions'

type Report = {
  id: string
  reporter_id: string
  reporter_name: string
  target_type: string
  target_id: string
  reason: string
  detail: string | null
  status: string
  created_at: string
  target_report_count: number
}

const REASON_LABELS: Record<string, string> = {
  ai_suspicion: 'AI生成物の疑い',
  inappropriate: '不適切なコンテンツ',
  harassment: 'ハラスメント',
  fraud: '詐欺・虚偽',
  spam: 'スパム',
  other: 'その他',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '未対応',
  reviewing: '確認中',
  resolved: '解決済み',
}

export default function ReportList({ reports: initialReports }: { reports: Report[] }) {
  const [reports, setReports] = useState(initialReports)
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<string>('')

  const filtered = filter ? reports.filter((r) => r.status === filter) : reports

  const handleStatusChange = (reportId: string, newStatus: 'reviewing' | 'resolved') => {
    startTransition(async () => {
      const result = await updateReportStatus(reportId, newStatus)
      if ('success' in result) {
        setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: newStatus } : r))
      }
    })
  }

  return (
    <div>
      {/* フィルター */}
      <div className="mt-4 flex gap-2">
        {['', 'pending', 'reviewing', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {s === '' ? 'すべて' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* リスト */}
      <div className="mt-6 space-y-4">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-zinc-400">通報はありません</p>
        )}
        {filtered.map((report) => (
          <div
            key={report.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    report.status === 'pending'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : report.status === 'reviewing'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {REASON_LABELS[report.reason] || report.reason}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <span>対象: {report.target_type} ({report.target_id.slice(0, 8)}...)</span>
                  {report.target_report_count >= 5 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                      PSD提出要求済
                    </span>
                  )}
                  {report.target_report_count >= 3 && report.target_report_count < 5 && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                      要確認（{report.target_report_count}件）
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  通報者: {report.reporter_name} ・ {new Date(report.created_at).toLocaleDateString('ja-JP')}
                </p>
                {report.detail && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{report.detail}</p>
                )}
              </div>

              {report.status !== 'resolved' && (
                <div className="flex shrink-0 gap-2">
                  {report.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(report.id, 'reviewing')}
                      disabled={isPending}
                      className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600"
                    >
                      確認中にする
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange(report.id, 'resolved')}
                    disabled={isPending}
                    className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
                  >
                    解決済み
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
