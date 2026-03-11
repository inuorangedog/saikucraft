'use client'

import { useState } from 'react'

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
  allSpecialties: GroupedSpecialties[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export default function SpecialtySelector({ allSpecialties, selectedIds, onChange }: Props) {
  const [expandedCategory, setExpandedCategory] = useState('')

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {allSpecialties.map((group) => {
          const hasSelected = group.specialties.some((s) => selectedIds.includes(s.id))
          return (
            <button
              key={group.category}
              type="button"
              onClick={() => setExpandedCategory(expandedCategory === group.category ? '' : group.category)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                expandedCategory === group.category || hasSelected
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {group.category}
              {hasSelected && ` (${group.specialties.filter((s) => selectedIds.includes(s.id)).length})`}
            </button>
          )
        })}
      </div>

      {expandedCategory && (
        <div className="flex flex-wrap gap-1.5 pl-1">
          {allSpecialties
            .find((g) => g.category === expandedCategory)
            ?.specialties.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                title={s.description || undefined}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedIds.includes(s.id)
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {s.name}
              </button>
            ))}
        </div>
      )}

      {selectedIds.length > 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {selectedIds.length}個選択中
        </p>
      )}
    </div>
  )
}
