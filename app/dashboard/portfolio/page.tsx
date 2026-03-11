import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import PortfolioManager from './_components/portfolio-manager'

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cp) redirect('/dashboard')

  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('id, title, description, image_url, tags, sort_order, is_r18')
    .eq('user_id', user.id)
    .order('sort_order')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          ポートフォリオ管理
        </h1>
        <PortfolioManager initialItems={portfolios || []} />
      </div>
    </div>
  )
}
