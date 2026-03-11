'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { acceptApplication, rejectApplication } from '../../application-actions'

type Application = {
  id: string
  creator_id: string
  creatorName: string
  message: string | null
  portfolio_url: string | null
  status: string
  created_at: string
  transactionId?: string | null
}

type Props = {
  applications: Application[]
}

export default function ApplicationList({ applications: initial }: Props) {
  const [applications, setApplications] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleAccept = (appId: string) => {
    if (!confirm('このクリエイターを採用しますか？取引が作成されます。')) return
    startTransition(async () => {
      const result = await acceptApplication(appId)
      if ('transactionId' in result) {
        setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: '採用' } : a))
        router.push(`/transactions/${result.transactionId}`)
      }
    })
  }

  const handleReject = (appId: string) => {
    if (!confirm('この応募を見送りにしますか？')) return
    startTransition(async () => {
      const result = await rejectApplication(appId)
      if ('success' in result) {
        setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: '不採用' } : a))
      }
    })
  }

  if (applications.length === 0) {
    return <p className="mt-4 text-sm text-zinc-400">まだ応募はありません</p>
  }

  const STATUS_BADGE: Record<string, string> = {
    '応募中': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    '採用': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    '不採用': 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    '辞退': 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  }

  return (
    <div className="mt-4 space-y-3">
      {applications.map((app) => (
        <div
          key={app.id}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/creators/${app.creator_id}`} className="font-medium text-zinc-900 hover:text-orange-500 dark:text-zinc-50 dark:hover:text-orange-400">{app.creatorName}</Link>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[app.status] || ''}`}>
                  {app.status}
                </span>
              </div>
              {app.portfolio_url && (
                <a
                  href={app.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-blue-500 hover:text-blue-600 hover:underline"
                >
                  ポートフォリオを見る
                </a>
              )}
              {app.message && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{app.message}</p>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(app.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>

            {app.status === '応募中' && (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => handleAccept(app.id)}
                  disabled={isPending}
                  className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                >
                  採用
                </button>
                <button
                  onClick={() => handleReject(app.id)}
                  disabled={isPending}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400"
                >
                  見送り
                </button>
              </div>
            )}
            {app.status === '採用' && app.transactionId && (
              <Link
                href={`/transactions/${app.transactionId}`}
                className="shrink-0 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
              >
                取引画面へ
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
