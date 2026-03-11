import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import NotificationSettingsForm from './_components/settings-form'

export default async function NotificationSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // デフォルト値
  const defaults = {
    message_email: true,
    message_site: true,
    status_change_email: true,
    status_change_site: true,
    favorite_available_email: true,
    favorite_available_site: true,
    boost_received_email: true,
    boost_received_site: true,
    dispute_email: true,
    dispute_site: true,
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">通知設定</h1>
        <NotificationSettingsForm settings={settings || defaults} />
      </div>
    </div>
  )
}
