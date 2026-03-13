'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

type Tag = {
  id: string
  name: string
  category: string
}

type Event = {
  id: string
  name: string
  date: string | null
  is_permanent: boolean
}

type Specialty = {
  id: string
  category: string
  name: string
  description: string | null
  sort_order: number
}

type GroupedSpecialties = {
  category: string
  specialties: Specialty[]
}

type Props = {
  allTags?: Tag[]
  allEvents?: Event[]
  allSpecialties?: GroupedSpecialties[]
}

export default function CreatorFilters({ allTags = [], allEvents = [], allSpecialties = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showTags, setShowTags] = useState(false)

  const status = searchParams.get('status') || ''
  const r18 = searchParams.get('r18') === '1'
  const commercial = searchParams.get('commercial') === '1'
  const urgent = searchParams.get('urgent') === '1'
  const selectedTags = searchParams.get('tags')?.split(',').filter(Boolean) || []
  const eventFilter = searchParams.get('event') || ''
  const specialtyFilter = searchParams.get('specialty') || ''

  // 選択中の職種カテゴリを特定（UUID=サブカテゴリ、文字列=カテゴリ名）
  const isSubcategory = /^[0-9a-f]{8}-/.test(specialtyFilter)
  const selectedCategory = isSubcategory
    ? allSpecialties.find((g) => g.specialties.some((s) => s.id === specialtyFilter))?.category || ''
    : specialtyFilter
  const [expandedCategory, setExpandedCategory] = useState(selectedCategory)

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // フィルター変更時は1ページ目に戻す
    router.push(`/creators?${params.toString()}`)
  }, [router, searchParams])

  const toggleParam = useCallback((key: string, current: boolean) => {
    updateParams(key, current ? '' : '1')
  }, [updateParams])

  const keyword = searchParams.get('q') || ''

  return (
    <div className="space-y-4">
      {/* キーワード検索 */}
      <div>
        <input
          type="text"
          defaultValue={keyword}
          placeholder="クリエイター名・自己紹介で検索"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParams('q', (e.target as HTMLInputElement).value.trim())
            }
          }}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* 職種フィルター */}
      {allSpecialties.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">職種:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setExpandedCategory('')
                updateParams('specialty', '')
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                !specialtyFilter && !expandedCategory
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              すべて
            </button>
            {allSpecialties.map((group) => (
              <button
                key={group.category}
                onClick={() => {
                  if (expandedCategory === group.category) {
                    setExpandedCategory('')
                    updateParams('specialty', '')
                  } else {
                    setExpandedCategory(group.category)
                    // カテゴリ押下でカテゴリ全体で絞り込み
                    updateParams('specialty', group.category)
                  }
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  expandedCategory === group.category
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {group.category}
              </button>
            ))}
          </div>

          {/* サブカテゴリ */}
          {expandedCategory && (
            <div className="flex flex-wrap gap-1.5 pl-1">
              {allSpecialties
                .find((g) => g.category === expandedCategory)
                ?.specialties.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateParams('specialty', specialtyFilter === s.id ? '' : s.id)}
                    title={s.description || undefined}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      specialtyFilter === s.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ステータスフィルター */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateParams('status', '')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            !status
              ? 'bg-orange-500 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
          }`}
        >
          すべて
        </button>
        <button
          onClick={() => updateParams('status', '受付中')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            status === '受付中'
              ? 'bg-green-500 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
          }`}
        >
          受付中のみ
        </button>
      </div>

      {/* 条件フィルター */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toggleParam('r18', r18)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            r18
              ? 'bg-red-500 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
          }`}
        >
          R18可
        </button>
        <button
          onClick={() => toggleParam('commercial', commercial)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            commercial
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
          }`}
        >
          商業可
        </button>
        <button
          onClick={() => toggleParam('urgent', urgent)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            urgent
              ? 'bg-yellow-500 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
          }`}
        >
          急ぎ対応可
        </button>
      </div>

      {/* イベントフィルター */}
      {allEvents.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">イベント:</span>
          <select
            value={eventFilter}
            onChange={(e) => updateParams('event', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <option value="">すべて</option>
            {allEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}{event.date && !event.is_permanent ? ` (${new Date(event.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div>
          <button
            onClick={() => setShowTags(!showTags)}
            className="text-sm text-orange-500 hover:text-orange-600"
          >
            {showTags ? 'タグを閉じる' : 'タグで絞り込む'}
            {selectedTags.length > 0 && ` (${selectedTags.length})`}
          </button>

          {showTags && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      const newTags = isSelected
                        ? selectedTags.filter((t) => t !== tag.id)
                        : selectedTags.length < 5
                          ? [...selectedTags, tag.id]
                          : selectedTags
                      updateParams('tags', newTags.length > 0 ? newTags.join(',') : '')
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {tag.name}
                  </button>
                )
              })}
              {selectedTags.length >= 5 && (
                <p className="w-full text-xs text-zinc-400">最大5個まで選択できます</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
