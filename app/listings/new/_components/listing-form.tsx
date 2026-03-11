'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createListing } from '../../actions'
import { updateListingTags } from '@/app/lib/tags'
import { updateListingSpecialties } from '@/app/lib/specialties'
import TagSelector from '@/app/_components/tag-selector'
import SpecialtySelector from '@/app/_components/specialty-selector'

type Tag = { id: string; name: string; category: string }
type Event = { id: string; name: string; date: string | null; is_permanent: boolean }
type Specialty = { id: string; category: string; name: string; description: string | null; sort_order: number }
type GroupedSpecialties = { category: string; specialties: Specialty[] }
type Props = { allTags: Tag[]; allEvents: Event[]; allSpecialties: GroupedSpecialties[] }

export default function ListingForm({ allTags, allEvents, allSpecialties }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [headcount, setHeadcount] = useState('1')
  const [deadline, setDeadline] = useState('')
  const [applicationDeadline, setApplicationDeadline] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [eventId, setEventId] = useState('')
  const [wantsCopyrightTransfer, setWantsCopyrightTransfer] = useState(false)
  const [wantsPortfolioBan, setWantsPortfolioBan] = useState(false)
  const [wantsCommercialUse, setWantsCommercialUse] = useState(false)
  const [policyAgreed, setPolicyAgreed] = useState(false)
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([])

  const budgetNum = budget ? parseInt(budget) : null
  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = () => {
    startTransition(async () => {
      setError('')
      if (deadline && deadline < today) {
        setError('希望納期は今日以降の日付を指定してください')
        return
      }
      if (applicationDeadline && applicationDeadline < today) {
        setError('募集締め切りは今日以降の日付を指定してください')
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
      const result = await createListing({
        title,
        description,
        budget: budgetNum,
        headcount: parseInt(headcount) || 1,
        deadline,
        applicationDeadline,
        eventId: eventId || null,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        if (selectedTagIds.length > 0) {
          await updateListingTags(result.id, selectedTagIds)
        }
        if (selectedSpecialtyIds.length > 0) {
          await updateListingSpecialties(result.id, selectedSpecialtyIds)
        }
        router.push(`/listings/${result.id}`)
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

      {/* 警告: 低額 */}
      {budgetNum !== null && budgetNum > 0 && budgetNum < 500 && (
        <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
          手数料を考慮するとクリエイターの手取りが非常に少なくなります
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
          placeholder="例: コミケ新刊の表紙イラスト募集"
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
          placeholder="依頼の詳細、希望するスタイル、参考イメージなどを記載してください"
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
            placeholder="5000"
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

      {/* イベント */}
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

      {/* タグ */}
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

      {/* 職種 */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          募集する職種
        </label>
        <p className="mt-0.5 text-xs text-zinc-400">どんなスキルを持つクリエイターを探しているか選択してください</p>
        <div className="mt-2">
          <SpecialtySelector
            allSpecialties={allSpecialties}
            selectedIds={selectedSpecialtyIds}
            onChange={setSelectedSpecialtyIds}
          />
        </div>
      </div>

      {/* 特別条件 */}
      <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">特別条件（任意）</p>
        <p className="text-xs text-zinc-400">選択した条件は応募者に表示され、追加料金が発生する場合があります</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={wantsCopyrightTransfer} onChange={(e) => setWantsCopyrightTransfer(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">著作権譲渡を希望</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={wantsPortfolioBan} onChange={(e) => setWantsPortfolioBan(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">ポートフォリオ掲載禁止を希望</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={wantsCommercialUse} onChange={(e) => setWantsCommercialUse(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500" />
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
          <input type="checkbox" checked={policyAgreed} onChange={(e) => setPolicyAgreed(e.target.checked)} className="h-4 w-4 rounded border-yellow-400 text-yellow-500 focus:ring-yellow-500" />
          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">キャンセルポリシーに同意する</span>
        </label>
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
          disabled={isPending || !title.trim() || !description.trim() || selectedTagIds.length === 0 || !policyAgreed}
          className="flex-1 rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          {isPending ? '作成中...' : '募集を公開する'}
        </button>
      </div>
    </div>
  )
}
