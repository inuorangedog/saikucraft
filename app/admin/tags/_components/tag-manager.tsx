'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTag, deleteTag } from '../actions'

type Tag = {
  id: string
  name: string
  category: string
}

const CATEGORIES = ['ジャンル', 'ソフト', 'テイスト']

export default function TagManager({ tags }: { tags: Tag[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [error, setError] = useState('')

  // カテゴリごとにグループ化
  const grouped = tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {})

  const handleCreate = () => {
    if (!name.trim()) return
    startTransition(async () => {
      setError('')
      const result = await createTag({ name, category })
      if ('error' in result) {
        setError(result.error)
      } else {
        setName('')
        router.refresh()
      }
    })
  }

  const handleDelete = (id: string, tagName: string) => {
    if (!confirm(`「${tagName}」を削除しますか？このタグを使用中のクリエイター・募集からも外れます。`)) return
    startTransition(async () => {
      const result = await deleteTag(id)
      if ('error' in result) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 追加フォーム */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">タグを追加</h3>
        <div className="mt-3 flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="タグ名"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !name.trim()}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
          >
            追加
          </button>
        </div>
      </div>

      {/* タグ一覧 */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([cat, catTags]) => (
          <div key={cat} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {cat}（{catTags.length}個）
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {catTags.map((tag) => (
                <span
                  key={tag.id}
                  className="group flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {tag.name}
                  <button
                    onClick={() => handleDelete(tag.id, tag.name)}
                    disabled={isPending}
                    className="ml-1 hidden text-red-400 hover:text-red-600 group-hover:inline"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <p className="text-center text-sm text-zinc-400">タグがありません</p>
        )}
      </div>

      <p className="text-xs text-zinc-400">合計 {tags.length} 個のタグ</p>
    </div>
  )
}
