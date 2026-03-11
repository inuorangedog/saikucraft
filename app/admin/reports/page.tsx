import { createClient } from '@/app/lib/supabase-server'
import ReportList from './_components/report-list'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('reports')
    .select('id, reporter_id, target_type, target_id, reason, detail, status, created_at')
    .order('created_at', { ascending: false })

  // 通報者名を取得
  const reporterIds = [...new Set((reports || []).map((r) => r.reporter_id))]
  const { data: profiles } = reporterIds.length > 0
    ? await supabase.from('profiles').select('user_id, username').in('user_id', reporterIds)
    : { data: [] }

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.username]))

  // 対象ごとの通報件数を集計
  const targetCounts = new Map<string, number>()
  for (const r of reports || []) {
    const key = `${r.target_type}:${r.target_id}`
    targetCounts.set(key, (targetCounts.get(key) ?? 0) + 1)
  }

  const reportList = (reports || []).map((r) => ({
    ...r,
    reporter_name: profileMap.get(r.reporter_id) || '不明',
    target_report_count: targetCounts.get(`${r.target_type}:${r.target_id}`) ?? 1,
  }))

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">通報管理</h1>
        <ReportList reports={reportList} />
      </div>
    </div>
  )
}
