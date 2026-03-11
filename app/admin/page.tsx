import Link from 'next/link'
import { createClient } from '@/app/lib/supabase-server'

export default async function AdminPage() {
  const supabase = await createClient()

  const { count: pendingReports } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: activeDisputes } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('status', '異議申し立て中')

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: totalTransactions } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })

  const { count: totalEvents } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })

  // 今月の収益データ
  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)
  thisMonthStart.setHours(0, 0, 0, 0)

  const { data: completedThisMonth } = await supabase
    .from('transactions')
    .select('amount')
    .eq('status', '完了')
    .eq('payment_status', 'transferred')
    .gte('created_at', thisMonthStart.toISOString())

  const monthlyGMV = (completedThisMonth || []).reduce((sum, t) => sum + t.amount, 0)
  const monthlyFee = Math.ceil(monthlyGMV * 0.07)

  // 先月の収益データ（前月比較用）
  const lastMonthStart = new Date(thisMonthStart)
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)

  const { data: completedLastMonth } = await supabase
    .from('transactions')
    .select('amount')
    .eq('status', '完了')
    .eq('payment_status', 'transferred')
    .gte('created_at', lastMonthStart.toISOString())
    .lt('created_at', thisMonthStart.toISOString())

  const lastMonthGMV = (completedLastMonth || []).reduce((sum, t) => sum + t.amount, 0)
  const lastMonthFee = Math.ceil(lastMonthGMV * 0.07)

  // 累計取引額
  const { data: allCompleted } = await supabase
    .from('transactions')
    .select('amount')
    .eq('status', '完了')

  const totalGMV = (allCompleted || []).reduce((sum, t) => sum + t.amount, 0)

  // BOOST手数料（直近30日）
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count: boostCount } = await supabase
    .from('boosts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo)

  // アクティブユーザー（直近7日にログインまたは取引操作）
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: activeUsers } = await supabase
    .from('messages')
    .select('sender_id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">管理画面</h1>

        {/* 統計 */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">未対応の通報</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{pendingReports ?? 0}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">ユーザー数</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalUsers ?? 0}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">取引数</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalTransactions ?? 0}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">イベント数</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalEvents ?? 0}</p>
          </div>
        </div>

        {/* 収益情報 */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">収益</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">今月の手数料収入</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">¥{monthlyFee.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-400">
                GMV: ¥{monthlyGMV.toLocaleString()}
              </p>
              {lastMonthFee > 0 && (
                <p className={`mt-0.5 text-xs font-medium ${monthlyFee >= lastMonthFee ? 'text-green-500' : 'text-red-500'}`}>
                  前月比 {lastMonthFee > 0 ? `${Math.round((monthlyFee / lastMonthFee) * 100)}%` : '-'}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">先月の手数料収入</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">¥{lastMonthFee.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-400">
                GMV: ¥{lastMonthGMV.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">累計取引額</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">¥{totalGMV.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-400">
                手数料累計: ¥{Math.ceil(totalGMV * 0.07).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">直近30日BOOST</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{boostCount ?? 0}件</p>
              <p className="mt-1 text-xs text-zinc-400">
                アクティブ: {activeUsers ?? 0}人/7日
              </p>
            </div>
          </div>
        </div>

        {/* メニュー */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/admin/reports" className="rounded-lg border border-zinc-200 bg-white p-6 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">通報管理</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">通報の確認・対応を行います</p>
          </Link>
          <Link href="/admin/disputes" className="rounded-lg border border-zinc-200 bg-white p-6 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">異議申し立て管理</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {activeDisputes ?? 0}件の異議申し立て対応
            </p>
          </Link>
          <Link href="/admin/events" className="rounded-lg border border-zinc-200 bg-white p-6 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">イベント管理</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">イベントの追加・編集・削除</p>
          </Link>
          <Link href="/admin/users" className="rounded-lg border border-zinc-200 bg-white p-6 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">ユーザー管理</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">アカウント停止・復旧</p>
          </Link>
          <Link href="/admin/tags" className="rounded-lg border border-zinc-200 bg-white p-6 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">タグ管理</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">タグの追加・削除</p>
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-zinc-200 bg-white p-6 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">ダッシュボードに戻る</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">通常のマイページに戻ります</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
