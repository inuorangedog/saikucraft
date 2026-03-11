import Link from 'next/link'
import { createClient } from '@/app/lib/supabase-server'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { username: string; avatar_url: string | null; user_type: string } | null = null
  let unreadCount = 0

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, user_type')
      .eq('user_id', user.id)
      .single()
    profile = data

    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    unreadCount = count ?? 0
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-orange-500">
          SaikuCraft
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            ホーム
          </Link>
          <Link href="/creators" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            クリエイター
          </Link>
          <Link href="/listings" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            募集一覧
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {profile ? (
            <>
              {/* Notifications */}
              <Link
                href="/dashboard/notifications"
                className="relative rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Dashboard */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full bg-zinc-100 py-1.5 pl-1.5 pr-3 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                    {profile.username.charAt(0)}
                  </div>
                )}
                <span className="hidden sm:inline">{profile.username}</span>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              ログイン
            </Link>
          )}

          {/* Mobile menu button */}
          <MobileMenu loggedIn={!!profile} />
        </div>
      </div>
    </header>
  )
}

function MobileMenu({ loggedIn }: { loggedIn: boolean }) {
  return (
    <details className="relative sm:hidden">
      <summary className="list-none rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </summary>
      <div className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 bg-white py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <Link href="/" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          ホーム
        </Link>
        <Link href="/creators" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          クリエイター
        </Link>
        <Link href="/listings" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          募集一覧
        </Link>
        {loggedIn && (
          <Link href="/dashboard" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
            ダッシュボード
          </Link>
        )}
      </div>
    </details>
  )
}
