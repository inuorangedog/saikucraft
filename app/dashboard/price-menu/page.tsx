import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import PriceMenuManager from './_components/price-menu-manager'

export default async function PriceMenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cp) redirect('/dashboard/profile')

  const { data: menus } = await supabase
    .from('price_menus')
    .select('id, label, price, price_note, sort_order')
    .eq('creator_id', cp.id)
    .order('sort_order')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          料金メニュー管理
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          プロフィールに表示される料金表を設定します（最大10件）
        </p>
        <PriceMenuManager initialMenus={menus || []} />
      </div>
    </div>
  )
}
