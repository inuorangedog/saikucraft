'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addPriceMenu, updatePriceMenu, deletePriceMenu, reorderPriceMenus } from '../actions'

type MenuItem = {
  id: string
  label: string
  price: number | null
  price_note: string | null
  sort_order: number
}

type Props = {
  initialMenus: MenuItem[]
}

export default function PriceMenuManager({ initialMenus }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initialMenus)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [label, setLabel] = useState('')
  const [price, setPrice] = useState('')
  const [priceNote, setPriceNote] = useState('')

  const resetForm = () => {
    setLabel('')
    setPrice('')
    setPriceNote('')
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  const openEdit = (item: MenuItem) => {
    setLabel(item.label)
    setPrice(item.price?.toString() ?? '')
    setPriceNote(item.price_note ?? '')
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!label.trim()) {
      setError('メニュー名を入力してください')
      return
    }

    startTransition(async () => {
      setError('')
      const data = {
        label,
        price: price ? parseInt(price) : null,
        priceNote,
      }

      if (editingId) {
        const result = await updatePriceMenu(editingId, data)
        if ('error' in result) { setError(result.error); return }
      } else {
        const result = await addPriceMenu(data)
        if ('error' in result) { setError(result.error); return }
      }

      resetForm()
      router.refresh()
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    startTransition(async () => {
      const result = await deletePriceMenu(id)
      if ('error' in result) { setError(result.error); return }
      setItems((prev) => prev.filter((item) => item.id !== id))
    })
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[newIndex]
    newItems[newIndex] = temp
    setItems(newItems)

    startTransition(async () => {
      const result = await reorderPriceMenus(newItems.map((item) => item.id))
      if ('error' in result) setError(result.error)
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* メニュー一覧 */}
      {items.length > 0 ? (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i > 0 ? 'border-t border-zinc-200 dark:border-zinc-700' : ''
              }`}
            >
              {/* 並び替えボタン */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0 || isPending}
                  className="text-xs text-zinc-400 hover:text-zinc-600 disabled:opacity-30 dark:hover:text-zinc-300"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveItem(i, 1)}
                  disabled={i === items.length - 1 || isPending}
                  className="text-xs text-zinc-400 hover:text-zinc-600 disabled:opacity-30 dark:hover:text-zinc-300"
                >
                  ▼
                </button>
              </div>

              {/* メニュー内容 */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.label}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {item.price ? `¥${item.price.toLocaleString()}` : ''}
                  {item.price_note || ''}
                  {!item.price && !item.price_note && '価格未設定'}
                </p>
              </div>

              {/* 操作 */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(item)}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.label)}
                  disabled={isPending}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-zinc-400">料金メニューがまだありません</p>
      )}

      {/* 追加/編集フォーム */}
      {showForm ? (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <h3 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {editingId ? 'メニューを編集' : 'メニューを追加'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                メニュー名 *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="例: アイコン制作"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  価格（円）
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="3000"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  補足
                </label>
                <input
                  type="text"
                  value={priceNote}
                  onChange={(e) => setPriceNote(e.target.value)}
                  placeholder="例: 〜, 要相談"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              価格と補足は組み合わせて表示されます（例: ¥3,000〜）
            </p>

            {price && parseInt(price) > 0 && parseInt(price) < 3000 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  あなたの技術には価値があります。市場の崩壊を防ぐためにも、金額を見直していただけると大変助かります。
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || !label.trim()}
                className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
              >
                {isPending ? '保存中...' : editingId ? '更新する' : '追加する'}
              </button>
            </div>
          </div>
        </div>
      ) : items.length < 10 ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg border-2 border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-500 hover:border-orange-400 hover:text-orange-500 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
        >
          + メニューを追加（{items.length}/10）
        </button>
      ) : (
        <p className="text-center text-sm text-zinc-400">メニューは最大10件までです</p>
      )}

      {/* 戻るリンク */}
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← ダッシュボードに戻る
        </button>
      </div>
    </div>
  )
}
