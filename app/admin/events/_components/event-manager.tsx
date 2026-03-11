'use client'

import { useTransition, useState } from 'react'
import { createEvent, deleteEvent } from '../../actions'

type Event = {
  id: string
  name: string
  date: string | null
  location: string | null
  scale: string | null
  is_permanent: boolean
  created_at: string
}

export default function EventManager({ events: initialEvents }: { events: Event[] }) {
  const [events, setEvents] = useState(initialEvents)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    date: '',
    location: '',
    scale: '',
    isPermanent: false,
  })

  const handleCreate = () => {
    if (!form.name.trim()) return
    startTransition(async () => {
      const result = await createEvent(form)
      if ('success' in result) {
        setShowForm(false)
        setForm({ name: '', date: '', location: '', scale: '', isPermanent: false })
        // ページリロードで最新データを取得
        window.location.reload()
      }
    })
  }

  const handleDelete = (eventId: string) => {
    if (!confirm('このイベントを削除しますか？')) return
    startTransition(async () => {
      const result = await deleteEvent(eventId)
      if ('success' in result) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId))
      }
    })
  }

  return (
    <div>
      <div className="mt-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          {showForm ? 'キャンセル' : '+ イベント追加'}
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                イベント名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="例: コミックマーケット104"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">開催日</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">会場</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="例: 東京ビッグサイト"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">規模</label>
              <select
                value={form.scale}
                onChange={(e) => setForm({ ...form, scale: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">選択してください</option>
                <option value="small">小規模</option>
                <option value="medium">中規模</option>
                <option value="large">大規模</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPermanent}
                onChange={(e) => setForm({ ...form, isPermanent: e.target.checked })}
                className="rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">常設イベント</span>
            </label>
            <button
              onClick={handleCreate}
              disabled={isPending || !form.name.trim()}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {isPending ? '作成中...' : '作成'}
            </button>
          </div>
        </div>
      )}

      {/* イベント一覧 */}
      <div className="mt-6 space-y-3">
        {events.length === 0 && (
          <p className="text-center text-sm text-zinc-400">イベントはありません</p>
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{event.name}</h3>
                {event.is_permanent && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    常設
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {event.date ? new Date(event.date).toLocaleDateString('ja-JP') : '日程未定'}
                {event.location && ` ・ ${event.location}`}
                {event.scale && ` ・ ${event.scale === 'small' ? '小規模' : event.scale === 'medium' ? '中規模' : '大規模'}`}
              </p>
            </div>
            <button
              onClick={() => handleDelete(event.id)}
              disabled={isPending}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
