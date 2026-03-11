'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { markAsRead, markAllAsRead } from '../actions'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  related_id: string | null
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  message: '💬',
  status_change: '📋',
  favorite_available: '⭐',
  boost_received: '🚀',
  dispute: '⚠️',
}

export default function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleClick = (notification: Notification) => {
    if (!notification.is_read) {
      startTransition(async () => {
        await markAsRead(notification.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        )
      })
    }

    // 関連ページに遷移
    if (notification.related_id) {
      if (notification.type === 'message' || notification.type === 'status_change' || notification.type === 'dispute') {
        router.push(`/transactions/${notification.related_id}`)
      }
    }
  }

  const handleMarkAll = () => {
    startTransition(async () => {
      const result = await markAllAsRead()
      if ('success' in result) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      }
    })
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            未読 {unreadCount}件
          </p>
          <button
            onClick={handleMarkAll}
            disabled={isPending}
            className="text-sm text-orange-500 hover:text-orange-600"
          >
            すべて既読にする
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {notifications.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-400">通知はありません</p>
        )}
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              n.is_read
                ? 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
            } hover:shadow-sm`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${
                  n.is_read
                    ? 'text-zinc-700 dark:text-zinc-300'
                    : 'font-medium text-zinc-900 dark:text-zinc-50'
                }`}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{n.body}</p>
                )}
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  {new Date(n.created_at).toLocaleString('ja-JP')}
                </p>
              </div>
              {!n.is_read && (
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
