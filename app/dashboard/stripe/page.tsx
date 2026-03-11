import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import StripeConnect from './_components/stripe-connect'

export default async function StripePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cp } = await supabase
    .from('creator_profiles')
    .select('stripe_account_id, stripe_onboarded')
    .eq('user_id', user.id)
    .single()

  if (!cp) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Stripe Connect 設定</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          報酬の受け取りにはStripeアカウントの設定が必要です。銀行口座の登録は1回のみで完了します。
        </p>
        <StripeConnect
          hasAccount={!!cp.stripe_account_id}
          isOnboarded={cp.stripe_onboarded}
        />
      </div>
    </div>
  )
}
