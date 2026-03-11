import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import Link from 'next/link'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // お気に入りクリエイターを取得
  const { data: favorites } = await supabase
    .from('favorites')
    .select('creator_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const creatorIds = (favorites || []).map((f) => f.creator_id)

  // プロフィール情報を取得
  const { data: profiles } = creatorIds.length > 0
    ? await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', creatorIds)
        .is('deleted_at', null)
    : { data: [] }

  // クリエイタープロフィールを取得
  const { data: creatorProfiles } = creatorIds.length > 0
    ? await supabase
        .from('creator_profiles')
        .select('user_id, status')
        .in('user_id', creatorIds)
    : { data: [] }

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]))
  const creatorMap = new Map((creatorProfiles || []).map((c) => [c.user_id, c]))

  const favoriteList = creatorIds
    .map((cid) => ({
      id: cid,
      profile: profileMap.get(cid),
      creator: creatorMap.get(cid),
    }))
    .filter((f) => f.profile)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">お気に入りクリエイター</h1>

        <div className="mt-6 space-y-3">
          {favoriteList.length === 0 && (
            <p className="py-12 text-center text-sm text-zinc-400">
              お気に入りのクリエイターはまだいません
            </p>
          )}
          {favoriteList.map((fav) => (
            <Link
              key={fav.id}
              href={`/creators/${fav.id}`}
              className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                {fav.profile!.avatar_url ? (
                  <img src={fav.profile!.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  fav.profile!.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{fav.profile!.username}</p>
                <p className={`text-sm ${
                  fav.creator?.status === '受付中'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-zinc-400'
                }`}>
                  {fav.creator?.status || '不明'}
                </p>
              </div>
              <span className="text-zinc-400">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
