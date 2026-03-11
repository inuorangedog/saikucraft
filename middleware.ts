import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase-middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // ログインページ: ログイン済みならダッシュボードへ
  if (path === '/login') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // 認証が必要なページ: 未ログインは/loginへ
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // プロフィールの存在チェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, deleted_at')
    .eq('user_id', user.id)
    .single()

  // 退会済みアカウントはログアウトさせる
  if (profile?.deleted_at) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // プロフィール未作成 → /onboardingへ
  if (!profile && !path.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // プロフィール作成済みで/onboardingにいる → /dashboardへ
  if (profile && path.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // /admin はadminロールのみ
  if (path.startsWith('/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/listings/new',
    '/transactions/:path*',
    '/negotiations/:path*',
    '/admin/:path*',
  ],
}
