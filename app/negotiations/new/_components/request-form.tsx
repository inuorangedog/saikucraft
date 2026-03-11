'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createNegotiation } from '../../actions'

type Props = {
  creatorId: string
  isAccepting: boolean
}

export default function RequestForm({ creatorId, isAccepting }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    wantsCopyrightTransfer: false,
    wantsPortfolioBan: false,
    wantsCommercialUse: false,
  })
  const [policyAgreed, setPolicyAgreed] = useState(false)

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setError('タイトルを入力してください')
      return
    }
    setError('')
    startTransition(async () => {
      const result = await createNegotiation({
        creatorId,
        title: form.title.trim(),
        description: form.description.trim(),
        budget: form.budget ? parseInt(form.budget) : null,
        deadline: form.deadline || null,
        wantsCopyrightTransfer: form.wantsCopyrightTransfer,
        wantsPortfolioBan: form.wantsPortfolioBan,
        wantsCommercialUse: form.wantsCommercialUse,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        router.push(`/negotiations/${result.negotiationId}`)
      }
    })
  }

  const budgetNum = parseInt(form.budget) || 0

  return (
    <div className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          依頼タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="例: VTuberのキャラクターデザイン"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          依頼内容
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={5}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="具体的な依頼内容・要望を記入してください"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            希望予算（円）
          </label>
          <input
            type="number"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="例: 10000"
            min={0}
          />
          {budgetNum > 0 && budgetNum < 500 && (
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
              手数料を考慮するとクリエイターの手取りが非常に少なくなります
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            希望納期
          </label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* 特別条件 */}
      <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">特別条件（任意）</p>
        <p className="text-xs text-zinc-400">選択した条件はクリエイターに通知され、追加料金が発生する場合があります</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.wantsCopyrightTransfer}
            onChange={(e) => setForm({ ...form, wantsCopyrightTransfer: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">著作権譲渡を希望</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.wantsPortfolioBan}
            onChange={(e) => setForm({ ...form, wantsPortfolioBan: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">ポートフォリオ掲載禁止を希望</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.wantsCommercialUse}
            onChange={(e) => setForm({ ...form, wantsCommercialUse: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">商業利用を希望</span>
        </label>
      </div>

      {/* キャンセルポリシー */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">キャンセルポリシー</p>
        <ul className="mt-2 space-y-1 text-xs text-yellow-600 dark:text-yellow-400">
          <li>- 取引開始〜ラフ提出前：全額返金</li>
          <li>- ラフ提出後〜詳細ラフ承認前：50%返金</li>
          <li>- 着手済み以降：返金なし</li>
        </ul>
        <label className="mt-3 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={policyAgreed}
            onChange={(e) => setPolicyAgreed(e.target.checked)}
            className="h-4 w-4 rounded border-yellow-400 text-yellow-500 focus:ring-yellow-500"
          />
          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">キャンセルポリシーに同意する</span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending || !isAccepting || !policyAgreed}
        className="w-full rounded-lg bg-orange-500 py-3 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {isPending ? '送信中...' : '依頼を送信する'}
      </button>
    </div>
  )
}
