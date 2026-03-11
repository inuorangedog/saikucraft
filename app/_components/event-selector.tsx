'use client'

type Event = {
  id: string
  name: string
  date: string | null
  is_permanent: boolean
}

type Props = {
  events: Event[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export default function EventSelector({ events, selectedIds, onChange }: Props) {
  const toggle = (eventId: string) => {
    if (selectedIds.includes(eventId)) {
      onChange(selectedIds.filter((id) => id !== eventId))
    } else {
      onChange([...selectedIds, eventId])
    }
  }

  const permanent = events.filter((e) => e.is_permanent)
  const upcoming = events.filter((e) => !e.is_permanent)

  return (
    <div className="space-y-3">
      {permanent.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">常設イベント</p>
          <div className="flex flex-wrap gap-1.5">
            {permanent.map((event) => (
              <button
                key={event.id}
                onClick={() => toggle(event.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedIds.includes(event.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {event.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">直近のイベント</p>
          <div className="flex flex-wrap gap-1.5">
            {upcoming.map((event) => (
              <button
                key={event.id}
                onClick={() => toggle(event.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedIds.includes(event.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {event.name}
                {event.date && (
                  <span className="ml-1 opacity-70">
                    ({new Date(event.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <p className="text-xs text-zinc-400">イベントが登録されていません</p>
      )}
    </div>
  )
}
