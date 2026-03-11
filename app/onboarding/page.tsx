import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import OnboardingForm from './_components/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            SaikuCraft
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            アカウントセットアップ
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  )
}
