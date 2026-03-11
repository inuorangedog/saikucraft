import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import DashboardClient from './_components/dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, user_type, avatar_url')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('bio, status, call_ok, max_revisions, is_r18_ok, is_commercial_ok, is_urgent_ok')
    .eq('user_id', user.id)
    .single()

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  // クリエイターの取引データ（受注側）
  const { data: creatorTransactions } = await supabase
    .from('transactions')
    .select('id, status, amount, created_at')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // クライアントの取引データ（依頼側）
  const { data: clientTransactions } = await supabase
    .from('transactions')
    .select('id, status, amount, created_at')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // 今月の収益（クリエイター向け）
  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)
  thisMonthStart.setHours(0, 0, 0, 0)
  const { data: monthlyRevenue } = await supabase
    .from('transactions')
    .select('amount')
    .eq('creator_id', user.id)
    .eq('status', '完了')
    .gte('created_at', thisMonthStart.toISOString())

  const totalRevenue = (monthlyRevenue || []).reduce((sum, t) => sum + Math.floor(t.amount * 0.93), 0)

  // クリエイターの応募一覧
  const { data: myApplications } = await supabase
    .from('listing_applications')
    .select('id, listing_id, status, created_at, listings(title)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const applicationList = (myApplications || []).map((a) => ({
    id: a.id,
    listingId: a.listing_id,
    listingTitle: (a as unknown as { listings: { title: string } }).listings?.title || '不明',
    status: a.status,
    createdAt: a.created_at,
  }))

  // クライアントの募集一覧
  const { data: myListings } = await supabase
    .from('listings')
    .select('id, title, status, created_at')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // クライアントの支払い合計
  const paidTransactions = (clientTransactions || []).filter((t) => t.status === '完了')
  const totalPaid = paidTransactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardClient
        profile={profile}
        creatorProfile={creatorProfile}
        unreadCount={unreadCount ?? 0}
        creatorTransactions={creatorTransactions || []}
        clientTransactions={clientTransactions || []}
        monthlyRevenue={totalRevenue}
        myApplications={applicationList}
        myListings={myListings || []}
        totalPaid={totalPaid}
      />
    </div>
  )
}
