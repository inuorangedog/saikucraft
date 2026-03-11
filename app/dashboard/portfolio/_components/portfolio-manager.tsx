'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addPortfolio, updatePortfolio, deletePortfolio } from '../actions'
import ImageUpload from '@/app/_components/image-upload'

type PortfolioItem = {
  id: string
  title: string
  description: string | null
  image_url: string
  tags: string[]
  sort_order: number
  is_r18: boolean
}

type Props = {
  initialItems: PortfolioItem[]
}

export default function PortfolioManager({ initialItems }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // フォーム
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [isR18, setIsR18] = useState(false)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setImageUrl('')
    setTagInput('')
    setIsR18(false)
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  const openEditForm = (item: PortfolioItem) => {
    setTitle(item.title)
    setDescription(item.description || '')
    setImageUrl(item.image_url)
    setTagInput(item.tags.join(', '))
    setIsR18(item.is_r18)
    setEditingId(item.id)
    setShowForm(true)
  }

  const parseTags = (input: string) =>
    input
      .split(/[,、\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }
    if (!imageUrl && !editingId) {
      setError('画像をアップロードしてください')
      return
    }

    startTransition(async () => {
      setError('')
      const tags = parseTags(tagInput)

      if (editingId) {
        const result = await updatePortfolio(editingId, { title, description, tags, isR18: isR18 })
        if ('error' in result) {
          setError(result.error)
          return
        }
      } else {
        const result = await addPortfolio({ title, description, imageUrl, tags, isR18: isR18 })
        if ('error' in result) {
          setError(result.error)
          return
        }
      }

      resetForm()
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('この作品を削除しますか？')) return
    startTransition(async () => {
      const result = await deletePortfolio(id)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setItems((prev) => prev.filter((item) => item.id !== id))
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 追加/編集フォーム */}
      {showForm ? (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <h3 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {editingId ? '作品を編集' : '作品を追加'}
          </h3>

          <div className="space-y-4">
            {!editingId && (
              <ImageUpload
                category="portfolio"
                onUpload={(url) => setImageUrl(url)}
                currentUrl={imageUrl || undefined}
                label="作品画像"
              />
            )}

            {editingId && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">現在の画像</label>
                <img src={imageUrl} alt="" className="h-32 rounded-lg object-cover" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                タイトル *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="作品のタイトル"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                説明
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="作品の説明（任意）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                タグ（カンマ区切り）
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="イラスト, キャラデザ, ロゴ"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isR18}
                onChange={(e) => setIsR18(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">R18作品</span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
              >
                {isPending ? '保存中...' : editingId ? '更新する' : '追加する'}
              </button>
            </div>
          </div>
        </div>
      ) : items.length >= 5 ? (
        <p className="text-center text-sm text-zinc-400">作品は最大5枚まで登録できます</p>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg border-2 border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-500 hover:border-orange-400 hover:text-orange-500 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
        >
          + 作品を追加（{items.length}/5）
        </button>
      )}

      {/* 作品一覧 */}
      {items.length === 0 ? (
        <p className="text-center text-sm text-zinc-400">まだ作品がありません</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
            >
              <div className="aspect-square">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {item.is_r18 && (
                <span className="absolute left-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-xs font-medium text-white">
                  R18
                </span>
              )}

              <div className="p-2">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.title}
                </p>
                {item.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 操作ボタン */}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => openEditForm(item)}
                  className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-zinc-700 shadow hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-300"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  className="rounded bg-red-500/90 px-2 py-1 text-xs font-medium text-white shadow hover:bg-red-500"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
