'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, updateCreatorProfile } from '../../actions'
import ImageUpload from '@/app/_components/image-upload'
import TagSelector from '@/app/_components/tag-selector'
import { updateCreatorTags } from '@/app/lib/tags'
import EventSelector from '@/app/_components/event-selector'
import { updateUserEvents } from '@/app/lib/events'
import SpecialtySelector from '@/app/_components/specialty-selector'
import { updateCreatorSpecialties } from '@/app/lib/specialties'

type Profile = {
  username: string
  user_type: string
  avatar_url: string | null
}

type CreatorProfile = {
  bio: string | null
  status: string
  call_ok: string
  max_revisions: number
  ng_content: string | null
  is_r18_ok: boolean
  is_commercial_ok: boolean
  is_urgent_ok: boolean
  twitter_url: string | null
  pixiv_url: string | null
  misskey_url: string | null
}

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

type Specialty = { id: string; category: string; name: string; description: string | null; sort_order: number }
type GroupedSpecialties = { category: string; specialties: Specialty[] }

type Props = {
  profile: Profile
  creatorProfile: CreatorProfile | null
  allTags: Tag[]
  initialTagIds: string[]
  allEvents: Event[]
  initialEventIds: string[]
  allSpecialties: GroupedSpecialties[]
  initialSpecialtyIds: string[]
}

export default function ProfileEditForm({ profile, creatorProfile, allTags, initialTagIds, allEvents, initialEventIds, allSpecialties, initialSpecialtyIds }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 基本情報
  const [username, setUsername] = useState(profile.username)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [userType, setUserType] = useState(profile.user_type as 'client' | 'creator' | 'both')

  // クリエイター情報
  const [bio, setBio] = useState(creatorProfile?.bio ?? '')
  const [status, setStatus] = useState<'受付中' | '停止中'>((creatorProfile?.status as '受付中' | '停止中') ?? '停止中')
  const [callOk, setCallOk] = useState<'不可' | '可' | '要相談'>((creatorProfile?.call_ok as '不可' | '可' | '要相談') ?? '不可')
  const [maxRevisions, setMaxRevisions] = useState(creatorProfile?.max_revisions ?? 3)
  const [ngContent, setNgContent] = useState(creatorProfile?.ng_content ?? '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds)
  const [isR18Ok, setIsR18Ok] = useState(creatorProfile?.is_r18_ok ?? false)
  const [isCommercialOk, setIsCommercialOk] = useState(creatorProfile?.is_commercial_ok ?? false)
  const [isUrgentOk, setIsUrgentOk] = useState(creatorProfile?.is_urgent_ok ?? false)
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(initialEventIds)
  const [twitterUrl, setTwitterUrl] = useState(creatorProfile?.twitter_url ?? '')
  const [pixivUrl, setPixivUrl] = useState(creatorProfile?.pixiv_url ?? '')
  const [misskeyUrl, setMisskeyUrl] = useState(creatorProfile?.misskey_url ?? '')
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>(initialSpecialtyIds)

  const showCreatorSection = userType === 'creator' || userType === 'both'

  const handleSave = () => {
    startTransition(async () => {
      setError('')
      setSuccess('')

      const profileResult = await updateProfile({ username, userType, avatarUrl: avatarUrl || undefined })
      if ('error' in profileResult) {
        setError(profileResult.error)
        return
      }

      if (showCreatorSection) {
        const creatorResult = await updateCreatorProfile({
          bio,
          status,
          callOk,
          maxRevisions,
          ngContent,
          isR18Ok,
          isCommercialOk,
          isUrgentOk,
          twitterUrl,
          pixivUrl,
          misskeyUrl,
        })
        if ('error' in creatorResult) {
          setError(creatorResult.error)
          return
        }

        const tagResult = await updateCreatorTags(selectedTagIds)
        if ('error' in tagResult) {
          setError(tagResult.error)
          return
        }

        const specResult = await updateCreatorSpecialties(selectedSpecialtyIds)
        if ('error' in specResult) {
          setError(specResult.error)
          return
        }
      }

      // イベント更新（全ユーザー共通）
      const eventResult = await updateUserEvents(selectedEventIds)
      if ('error' in eventResult) {
        setError(eventResult.error)
        return
      }

      setSuccess('保存しました')
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600 dark:bg-green-950 dark:text-green-400">
          {success}
        </div>
      )}

      {/* 基本情報 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">基本情報</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            アバター画像
          </label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-orange-100 text-xl font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <ImageUpload
              category="avatar"
              currentUrl={avatarUrl || undefined}
              onUpload={(url) => setAvatarUrl(url)}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ユーザー名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            利用タイプ
          </label>
          <div className="mt-2 flex gap-3">
            {([
              { value: 'client' as const, label: '依頼者' },
              { value: 'creator' as const, label: 'クリエイター' },
              { value: 'both' as const, label: '両方' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setUserType(opt.value)}
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                  userType === opt.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* クリエイター情報 */}
      {showCreatorSection && (
        <section className="space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-700">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">クリエイター情報</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              自己紹介文（Markdown可）
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">受注ステータス</label>
            <div className="mt-2 flex gap-3">
              {(['受付中', '停止中'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    status === s
                      ? s === '受付中'
                        ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : 'border-zinc-500 bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">通話可否</label>
            <div className="mt-2 flex gap-3">
              {(['不可', '可', '要相談'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCallOk(c)}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    callOk === c
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              修正回数上限
            </label>
            <input
              type="number"
              value={maxRevisions}
              onChange={(e) => setMaxRevisions(parseInt(e.target.value) || 0)}
              min={0}
              max={99}
              className="mt-1 w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              得意タグ（最大10個）
            </label>
            <div className="mt-2">
              <TagSelector
                allTags={allTags}
                selectedIds={selectedTagIds}
                onChange={setSelectedTagIds}
                maxCount={10}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              対応可能な職種
            </label>
            <p className="mt-0.5 text-xs text-zinc-400">あなたが対応できる職種を選択してください（無制限）</p>
            <div className="mt-2">
              <SpecialtySelector
                allSpecialties={allSpecialties}
                selectedIds={selectedSpecialtyIds}
                onChange={setSelectedSpecialtyIds}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              NG事項
            </label>
            <textarea
              value={ngContent}
              onChange={(e) => setNgContent(e.target.value)}
              rows={3}
              placeholder="お受けできない内容を記載してください"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isR18Ok}
                onChange={(e) => setIsR18Ok(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">R18対応可</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCommercialOk}
                onChange={(e) => setIsCommercialOk(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">商業利用可</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isUrgentOk}
                onChange={(e) => setIsUrgentOk(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">急ぎ対応可</span>
            </label>
          </div>
          {/* 外部リンク */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              外部リンク
            </label>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-zinc-500">X (Twitter)</span>
              <input
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/username"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-zinc-500">pixiv</span>
              <input
                type="url"
                value={pixivUrl}
                onChange={(e) => setPixivUrl(e.target.value)}
                placeholder="https://www.pixiv.net/users/12345"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-zinc-500">Misskey</span>
              <input
                type="url"
                value={misskeyUrl}
                onChange={(e) => setMisskeyUrl(e.target.value)}
                placeholder="https://misskey.io/@username"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        </section>
      )}

      {/* 参加イベント */}
      {allEvents.length > 0 && (
        <section className="space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-700">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">参加イベント</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            参加予定のイベントを選択すると、イベントで絞り込み検索できるようになります
          </p>
          <EventSelector
            events={allEvents}
            selectedIds={selectedEventIds}
            onChange={setSelectedEventIds}
          />
        </section>
      )}

      {/* 保存ボタン */}
      <div className="flex gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          戻る
        </button>
        <button
          onClick={handleSave}
          disabled={isPending || !username.trim()}
          className="flex-1 rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          {isPending ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  )
}
