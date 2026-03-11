import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import WithdrawForm from './_components/withdraw-form'
import { checkCanWithdraw } from './actions'

export default async function DeleteAccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { canWithdraw, activeTransactionCount } = await checkCanWithdraw()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
          アカウント退会
        </h1>
        <WithdrawForm
          canWithdraw={canWithdraw}
          activeTransactionCount={activeTransactionCount}
        />
      </div>
    </div>
  )
}
