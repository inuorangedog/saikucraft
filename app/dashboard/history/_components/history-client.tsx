'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLATFORM_FEE_PERCENT = 7

type Transaction = {
  id: string
  status: string
  amount: number
  paymentStatus: string
  createdAt: string
  deadline: string | null
  deliveredAt: string | null
  partnerName: string
}

type Boost = {
  id: string
  amount: number
  createdAt: string
  transactionId: string
}

type Props = {
  isCreator: boolean
  isClient: boolean
  creatorTransactions: Transaction[]
  clientTransactions: Transaction[]
  boostsSent: Boost[]
  boostsReceived: Boost[]
}

type Tab = 'creator' | 'client' | 'boost'
type Filter = 'all' | 'active' | 'completed'

const STATUS_LABELS: Record<string, string> = {
  unpaid: '未払い',
  processing: '入金待ち',
  paid: '支払い済み',
  transferred: '送金済み',
  refunded: '返金済み',
  partially_refunded: '一部返金',
  canceled: 'キャンセル',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function isActive(status: string) {
  return !['完了', '異議申し立て中'].includes(status)
}

export default function HistoryClient({
  isCreator,
  isClient,
  creatorTransactions,
  clientTransactions,
  boostsSent,
  boostsReceived,
}: Props) {
  const defaultTab: Tab = isCreator ? 'creator' : 'client'
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: 'creator', label: '受注（クリエイター）', show: isCreator },
    { key: 'client', label: '発注（依頼者）', show: isClient },
    { key: 'boost', label: 'BOOST', show: true },
  ]

  const currentTx = tab === 'creator' ? creatorTransactions : clientTransactions
  const filteredTx = currentTx.filter(t => {
    if (filter === 'active') return isActive(t.status)
    if (filter === 'completed') return !isActive(t.status)
    return true
  })

  // 集計
  const completedCreator = creatorTransactions.filter(t => t.status === '完了' && t.paymentStatus === 'transferred')
  const totalEarnings = completedCreator.reduce((sum, t) => sum + Math.floor(t.amount * (100 - PLATFORM_FEE_PERCENT) / 100), 0)
  const totalFeesPaid = completedCreator.reduce((sum, t) => sum + Math.ceil(t.amount * PLATFORM_FEE_PERCENT / 100), 0)
  const completedClient = clientTransactions.filter(t => t.status === '完了')
  const totalSpent = completedClient.reduce((sum, t) => sum + t.amount, 0)
  const totalBoostSent = boostsSent.reduce((sum, b) => sum + b.amount, 0)
  const totalBoostReceived = boostsReceived.reduce((sum, b) => sum + b.amount, 0)

  const handleExportCSV = () => {
    const rows: string[][] = []

    if (tab === 'boost') {
      rows.push(['種別', '金額', '日付', '取引ID'])
      for (const b of boostsSent) {
        rows.push(['BOOST送信', `${b.amount}`, formatDate(b.createdAt), b.transactionId])
      }
      for (const b of boostsReceived) {
        rows.push(['BOOST受信', `${b.amount}`, formatDate(b.createdAt), b.transactionId])
      }
    } else {
      const role = tab === 'creator' ? '受注' : '発注'
      rows.push(['種別', '相手', '金額', '手数料', '手取り/支払い', 'ステータス', '決済状況', '取引開始日', '納期', '納品日', '取引ID'])
      for (const t of filteredTx) {
        const fee = tab === 'creator' ? Math.ceil(t.amount * PLATFORM_FEE_PERCENT / 100) : 0
        const net = tab === 'creator' ? t.amount - fee : t.amount
        rows.push([
          role,
          t.partnerName,
          `${t.amount}`,
          `${fee}`,
          `${net}`,
          t.status,
          STATUS_LABELS[t.paymentStatus] || t.paymentStatus,
          formatDate(t.createdAt),
          t.deadline || '',
          t.deliveredAt ? formatDate(t.deliveredAt) : '',
          t.id,
        ])
      }
    }

    const bom = '\uFEFF'
    const csv = bom + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `saikucraft_${tab}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* サマリー */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isCreator && (
          <>
            <SummaryCard label="総収益（手取り）" value={`¥${totalEarnings.toLocaleString()}`} />
            <SummaryCard label="手数料合計" value={`¥${totalFeesPaid.toLocaleString()}`} sub={`${PLATFORM_FEE_PERCENT}%`} />
          </>
        )}
        {isClient && (
          <SummaryCard label="総支払額" value={`¥${totalSpent.toLocaleString()}`} />
        )}
        <SummaryCard
          label="BOOST"
          value={`送 ¥${totalBoostSent.toLocaleString()}`}
          sub={isCreator ? `受 ¥${totalBoostReceived.toLocaleString()}` : undefined}
        />
      </div>

      {/* タブ */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {tabs.filter(t => t.show).map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelectedTx(null) }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* フィルター + CSV */}
      {tab !== 'boost' && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {([
              { key: 'all' as const, label: 'すべて' },
              { key: 'active' as const, label: '進行中' },
              { key: 'completed' as const, label: '完了済み' },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            CSVエクスポート
          </button>
        </div>
      )}

      {/* BOOST タブ */}
      {tab === 'boost' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              CSVエクスポート
            </button>
          </div>

          {boostsSent.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">送信したBOOST</h3>
              <div className="space-y-2">
                {boostsSent.map(b => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                    <div>
                      <span className="text-sm font-medium text-orange-600">¥{b.amount.toLocaleString()}</span>
                      <span className="ml-2 text-xs text-zinc-400">{formatDate(b.createdAt)}</span>
                    </div>
                    <Link href={`/transactions/${b.transactionId}`} className="text-xs text-orange-500 hover:underline">
                      取引を見る
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {boostsReceived.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">受信したBOOST</h3>
              <div className="space-y-2">
                {boostsReceived.map(b => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                    <div>
                      <span className="text-sm font-medium text-green-600">¥{b.amount.toLocaleString()}</span>
                      <span className="ml-2 text-xs text-zinc-400">{formatDate(b.createdAt)}</span>
                    </div>
                    <Link href={`/transactions/${b.transactionId}`} className="text-xs text-orange-500 hover:underline">
                      取引を見る
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {boostsSent.length === 0 && boostsReceived.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-400">BOOSTの履歴はありません</p>
          )}
        </div>
      ) : (
        /* 取引一覧 */
        <div className="space-y-2">
          {filteredTx.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">該当する取引はありません</p>
          ) : (
            filteredTx.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTx(selectedTx?.id === t.id ? null : t)}
                className={`w-full rounded-lg border bg-white px-4 py-3 text-left transition-colors dark:bg-zinc-900 ${
                  selectedTx?.id === t.id
                    ? 'border-orange-400 ring-1 ring-orange-400'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={t.status} />
                    <div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {t.partnerName}
                      </span>
                      <span className="ml-2 text-xs text-zinc-400">{formatDate(t.createdAt)}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    ¥{t.amount.toLocaleString()}
                  </span>
                </div>

                {/* 明細展開 */}
                {selectedTx?.id === t.id && (
                  <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <ReceiptDetail tx={t} role={tab} />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
      {sub && <p className="text-xs text-zinc-400">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === '完了'
  const isDispute = status === '異議申し立て中'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      isCompleted
        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        : isDispute
          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    }`}>
      {status}
    </span>
  )
}

function ReceiptDetail({ tx, role }: { tx: Transaction; role: string }) {
  const fee = role === 'creator' ? Math.ceil(tx.amount * PLATFORM_FEE_PERCENT / 100) : 0
  const net = role === 'creator' ? tx.amount - fee : tx.amount

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>SaikuCraft 取引明細</title>
      <style>
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #333; }
        h1 { font-size: 20px; border-bottom: 2px solid #f97316; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td { padding: 8px 0; border-bottom: 1px solid #eee; }
        td:last-child { text-align: right; font-weight: bold; }
        .total { font-size: 18px; border-top: 2px solid #333; }
        .meta { color: #888; font-size: 13px; }
        .footer { margin-top: 40px; text-align: center; color: #aaa; font-size: 12px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <h1>取引明細書</h1>
      <p class="meta">発行日: ${new Date().toLocaleDateString('ja-JP')}</p>
      <p class="meta">取引ID: ${tx.id}</p>
      <table>
        <tr><td>取引相手</td><td>${tx.partnerName}</td></tr>
        <tr><td>取引開始日</td><td>${formatDate(tx.createdAt)}</td></tr>
        ${tx.deadline ? `<tr><td>納期</td><td>${tx.deadline}</td></tr>` : ''}
        ${tx.deliveredAt ? `<tr><td>納品日</td><td>${formatDate(tx.deliveredAt)}</td></tr>` : ''}
        <tr><td>ステータス</td><td>${tx.status}</td></tr>
        <tr><td>決済状況</td><td>${STATUS_LABELS[tx.paymentStatus] || tx.paymentStatus}</td></tr>
        <tr><td>取引金額</td><td>¥${tx.amount.toLocaleString()}</td></tr>
        ${role === 'creator' ? `
          <tr><td>プラットフォーム手数料 (${PLATFORM_FEE_PERCENT}%)</td><td>-¥${fee.toLocaleString()}</td></tr>
          <tr class="total"><td>手取り額</td><td>¥${net.toLocaleString()}</td></tr>
        ` : `
          <tr class="total"><td>お支払い額</td><td>¥${tx.amount.toLocaleString()}</td></tr>
        `}
      </table>
      <div class="footer">
        <p>SaikuCraft</p>
        <p>この明細書はSaikuCraftでの取引記録に基づいて発行されたものです。</p>
        <p>※ 適格請求書（インボイス）ではありません。</p>
      </div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-zinc-500">取引金額</span>
        <span className="text-right font-medium text-zinc-900 dark:text-zinc-50">¥{tx.amount.toLocaleString()}</span>

        {role === 'creator' && (
          <>
            <span className="text-zinc-500">手数料 ({PLATFORM_FEE_PERCENT}%)</span>
            <span className="text-right text-red-500">-¥{fee.toLocaleString()}</span>
            <span className="text-zinc-500 font-medium">手取り額</span>
            <span className="text-right font-bold text-green-600">¥{net.toLocaleString()}</span>
          </>
        )}

        <span className="text-zinc-500">決済状況</span>
        <span className="text-right">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            tx.paymentStatus === 'paid' || tx.paymentStatus === 'transferred'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : tx.paymentStatus === 'refunded'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
          }`}>
            {STATUS_LABELS[tx.paymentStatus] || tx.paymentStatus}
          </span>
        </span>

        {tx.deadline && (
          <>
            <span className="text-zinc-500">納期</span>
            <span className="text-right text-zinc-900 dark:text-zinc-50">{tx.deadline}</span>
          </>
        )}

        {tx.deliveredAt && (
          <>
            <span className="text-zinc-500">納品日</span>
            <span className="text-right text-zinc-900 dark:text-zinc-50">{formatDate(tx.deliveredAt)}</span>
          </>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Link
          href={`/transactions/${tx.id}`}
          className="flex-1 rounded-lg border border-zinc-300 py-1.5 text-center text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300"
        >
          取引を開く
        </Link>
        <button
          onClick={handlePrint}
          className="flex-1 rounded-lg border border-zinc-300 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300"
        >
          明細を印刷 / PDF
        </button>
      </div>
    </div>
  )
}
