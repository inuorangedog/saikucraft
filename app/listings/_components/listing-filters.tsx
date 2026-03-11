'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

type Tag = { id: string; name: string; category: string }
type Event = { id: string; name: string; date: string | null; is_permanent: boolean }
type Specialty = { id: string; category: string; name: string; description: string | null; sort_order: number }
type GroupedSpecialties = { category: string; specialties: Specialty[] }
type Props = { allTags?: Tag[]; allEvents?: Event[]; allSpecialties?: GroupedSpecialties[] }

const SORT_OPTIONS = [
  { value: '', label: '新着順' },
  { value: 'deadline', label: '締切が近い順' },
  { value: 'budget_high', label: '予算が高い順' },
]

export default function ListingFilters({ allTags = [], allEvents = [], allSpecialties = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showTags, setShowTags] = useState(false)

  const sort = searchParams.get('sort') || ''
  const status = searchParams.get('status') || ''
  const selectedTags = searchParams.get('tags')?.split(',').filter(Boolean) || []
  const eventFilter = searchParams.get('event') || ''
  const budgetMin = searchParams.get('budget_min') || ''
  const budgetMax = searchParams.get('budget_max') || ''
  const specialtyFilter = searchParams.get('specialty') || ''

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
    params.delete('page')
    router.push(`/listings?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="space-y-3">
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
                  ? 'bg-blue-500 text-white'
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
                    updateParams('specialty', group.category)
                  }
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  expandedCategory === group.category
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {group.category}
              </button>
            ))}
          </div>

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
                        ? 'bg-blue-500 text-white'
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

      <div className="flex flex-wrap items-center gap-3">
        {/* ステータス */}
        <div className="flex gap-2">
          <button
            onClick={() => updateParams('status', '')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              !status
                ? 'bg-blue-500 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => updateParams('status', '募集中')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              status === '募集中'
                ? 'bg-green-500 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            募集中のみ
          </button>
        </div>

        {/* 並び順 */}
        <select
          value={sort}
          onChange={(e) => updateParams('sort', e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 予算範囲 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">予算:</span>
        <input
          type="number"
          min="0"
          value={budgetMin}
          onChange={(e) => updateParams('budget_min', e.target.value)}
          placeholder="下限"
          className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        />
        <span className="text-xs text-zinc-400">〜</span>
        <input
          type="number"
          min="0"
          value={budgetMax}
          onChange={(e) => updateParams('budget_max', e.target.value)}
          placeholder="上限"
          className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        />
        <span className="text-xs text-zinc-400">円</span>
        {(budgetMin || budgetMax) && (
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.delete('budget_min')
              params.delete('budget_max')
              params.delete('page')
              router.push(`/listings?${params.toString()}`)
            }}
            className="rounded-full px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            リセット
          </button>
        )}
      </div>

      {/* イベントフィルター */}
      {allEvents.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">イベント:</span>
          <select
            value={eventFilter}
            onChange={(e) => updateParams('event', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
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
            className="text-sm text-blue-500 hover:text-blue-600"
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
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
