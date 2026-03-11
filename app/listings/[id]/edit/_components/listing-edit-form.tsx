'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateListing } from '../../../actions'
import { updateListingTags } from '@/app/lib/tags'
import { updateListingSpecialties } from '@/app/lib/specialties'
import TagSelector from '@/app/_components/tag-selector'
import SpecialtySelector from '@/app/_components/specialty-selector'

type Tag = { id: string; name: string; category: string }
type Event = { id: string; name: string; date: string | null; is_permanent: boolean }
type Specialty = { id: string; category: string; name: string; description: string | null; sort_order: number }
type GroupedSpecialties = { category: string; specialties: Specialty[] }

type Listing = {
  id: string
  title: string
  description: string | null
  budget: number | null
  headcount: number
  deadline: string | null
  application_deadline: string | null
  event_id: string | null
}

type Props = {
  listing: Listing
  allTags: Tag[]
  allEvents: Event[]
  allSpecialties: GroupedSpecialties[]
  initialTagIds: string[]
  initialSpecialtyIds: string[]
}

export default function ListingEditForm({ listing, allTags, allEvents, allSpecialties, initialTagIds, initialSpecialtyIds }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [title, setTitle] = useState(listing.title)
  const [description, setDescription] = useState(listing.description || '')
  const [budget, setBudget] = useState(listing.budget?.toString() || '')
  const [headcount, setHeadcount] = useState(listing.headcount.toString())
  const [deadline, setDeadline] = useState(listing.deadline || '')
  const [applicationDeadline, setApplicationDeadline] = useState(listing.application_deadline || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds)
  const [eventId, setEventId] = useState(listing.event_id || '')
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>(initialSpecialtyIds)

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = () => {
    startTransition(async () => {
      setError('')
      if (!title.trim()) {
        setError('タイトルを入力してください')
        return
      }
      if (!description.trim()) {
        setError('詳細説明を入力してください')
        return
      }
      if (selectedTagIds.length === 0) {
        setError('タグを1つ以上選択してください')
        return
      }

      const result = await updateListing(listing.id, {
        title,
        description,
        budget: budget ? parseInt(budget) : null,
        headcount: parseInt(headcount) || 1,
        deadline,
        applicationDeadline,
        eventId: eventId || null,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        await updateListingTags(listing.id, selectedTagIds)
        await updateListingSpecialties(listing.id, selectedSpecialtyIds)
        router.push(`/listings/${listing.id}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          詳細説明 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            予算（1人あたり・円）
          </label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min={0}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            募集人数
          </label>
          <input
            type="number"
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value)}
            min={1}
            max={99}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            希望納期
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={today}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            募集締め切り
          </label>
          <input
            type="date"
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            min={today}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {allEvents.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            関連イベント
          </label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">なし</option>
            {allEvents.filter((e) => e.is_permanent).map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
            {allEvents.filter((e) => !e.is_permanent).map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}{event.date ? ` (${new Date(event.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          タグ（1〜5個） <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <TagSelector
            allTags={allTags}
            selectedIds={selectedTagIds}
            onChange={setSelectedTagIds}
            maxCount={5}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          募集する職種
        </label>
        <div className="mt-2">
          <SpecialtySelector
            allSpecialties={allSpecialties}
            selectedIds={selectedSpecialtyIds}
            onChange={setSelectedSpecialtyIds}
          />
        </div>
      </div>

      <div className="flex gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <button
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          キャンセル
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending || !title.trim() || !description.trim() || selectedTagIds.length === 0}
          className="flex-1 rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          {isPending ? '保存中...' : '変更を保存'}
        </button>
      </div>
    </div>
  )
}
