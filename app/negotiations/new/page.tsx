import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import RequestForm from './_components/request-form'

type Props = {
  searchParams: Promise<{ creator?: string }>
}

export default async function NewNegotiationPage({ searchParams }: Props) {
  const params = await searchParams
  const creatorId = params.creator
  if (!creatorId) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.id === creatorId) redirect(`/creators/${creatorId}`)

  // クリエイター情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('user_id', creatorId)
    .is('deleted_at', null)
    .single()

  if (!profile) notFound()

  const { data: creator } = await supabase
    .from('creator_profiles')
    .select('status')
    .eq('user_id', creatorId)
    .single()

  if (!creator) notFound()

  // クールダウンチェック
  const { data: cooldown } = await supabase
    .from('negotiation_cooldowns')
    .select('available_at')
    .eq('client_id', user.id)
    .eq('creator_id', creatorId)
    .gte('available_at', new Date().toISOString())
    .single()

  const cooldownUntil = cooldown?.available_at || null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">指名依頼</h1>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              profile.username.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {profile.username}さんに依頼
          </span>
        </div>
        {creator.status !== '受付中' && (
          <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
            このクリエイターは現在受付停止中です
          </div>
        )}
        {cooldownUntil && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/30">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">クールダウン中</p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {new Date(cooldownUntil).toLocaleDateString('ja-JP')}以降に再度依頼できます
              （残り{Math.ceil((new Date(cooldownUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}日）
            </p>
          </div>
        )}
        <RequestForm creatorId={creatorId} isAccepting={creator.status === '受付中' && !cooldownUntil} />
      </div>
    </div>
  )
}
