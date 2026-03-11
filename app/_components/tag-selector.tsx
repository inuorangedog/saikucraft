'use client'

import { useState } from 'react'

type Tag = {
  id: string
  name: string
  category: string
}

type Props = {
  allTags: Tag[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  maxCount?: number
}

export default function TagSelector({ allTags, selectedIds, onChange, maxCount = 10 }: Props) {
  const [filter, setFilter] = useState('')

  // カテゴリごとにグループ化
  const grouped = allTags.reduce<Record<string, Tag[]>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {})

  const toggle = (tagId: string) => {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId))
    } else if (selectedIds.length < maxCount) {
      onChange([...selectedIds, tagId])
    }
  }

  const filteredGrouped = Object.entries(grouped).reduce<Record<string, Tag[]>>((acc, [cat, tags]) => {
    const filtered = filter
      ? tags.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()))
      : tags
    if (filtered.length > 0) acc[cat] = filtered
    return acc
  }, {})

  const selectedTags = allTags.filter((t) => selectedIds.includes(t.id))

  return (
    <div>
      {/* 選択済みタグ */}
      {selectedTags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggle(tag.id)}
              className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-600"
            >
              {tag.name}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
              </svg>
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="タグを検索..."
        className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />

      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        {selectedIds.length}/{maxCount}個 選択中
      </p>

      <div className="max-h-60 space-y-3 overflow-y-auto">
        {Object.entries(filteredGrouped).map(([category, tags]) => (
          <div key={category}>
            <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{category}</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const selected = selectedIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggle(tag.id)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
