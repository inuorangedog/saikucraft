'use client'

import { useTransition, useState } from 'react'
import { updateNotificationSettings } from '../../actions'

type Settings = {
  message_email: boolean
  message_site: boolean
  status_change_email: boolean
  status_change_site: boolean
  favorite_available_email: boolean
  favorite_available_site: boolean
  boost_received_email: boolean
  boost_received_site: boolean
  dispute_email: boolean
  dispute_site: boolean
}

const CATEGORIES = [
  { label: 'メッセージ', key: 'message' },
  { label: 'ステータス変更', key: 'status_change' },
  { label: 'お気に入りクリエイターが受付中', key: 'favorite_available' },
  { label: 'BOOST受信', key: 'boost_received' },
  { label: '異議申し立て', key: 'dispute' },
]

export default function NotificationSettingsForm({ settings: initial }: { settings: Settings }) {
  const [settings, setSettings] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const toggle = (key: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateNotificationSettings(settings)
      if ('success' in result) {
        setSaved(true)
      }
    })
  }

  return (
    <div className="mt-6">
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400" />
          <span className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">サイト</span>
          <span className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">メール</span>
        </div>
        {CATEGORIES.map((cat) => {
          const siteKey = `${cat.key}_site` as keyof Settings
          const emailKey = `${cat.key}_email` as keyof Settings
          return (
            <div
              key={cat.key}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-800"
            >
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{cat.label}</span>
              <div className="flex justify-center">
                <button
                  onClick={() => toggle(siteKey)}
                  className={`h-6 w-10 rounded-full transition-colors ${
                    settings[siteKey] ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings[siteKey] ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => toggle(emailKey)}
                  className={`h-6 w-10 rounded-full transition-colors ${
                    settings[emailKey] ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings[emailKey] ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {isPending ? '保存中...' : '保存'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">保存しました</span>
        )}
      </div>
    </div>
  )
}
