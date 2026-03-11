import { createClient } from '@/app/lib/supabase-server'
import EventManager from './_components/event-manager'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, name, date, location, scale, is_permanent, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">イベント管理</h1>
        <EventManager events={events || []} />
      </div>
    </div>
  )
}
