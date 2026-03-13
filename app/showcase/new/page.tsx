'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createShowcase } from '../actions'

const MEDIA_TYPES = [
  { value: 'image' as const, label: '画像', accept: '.jpg,.jpeg,.png,.webp,.gif' },
  { value: 'video' as const, label: '動画', accept: '.mp4,.webm,.mov' },
  { value: 'audio' as const, label: '音声', accept: '.mp3,.wav,.ogg,.m4a' },
]

export default function NewShowcasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get('tx') || ''

  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image')
  const [mediaUrl, setMediaUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const currentType = MEDIA_TYPES.find((t) => t.value === mediaType)!

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileName: file.name,
          category: 'showcase',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'アップロード準備に失敗しました')
        setUploading(false)
        return
      }

      // R2に直接アップロード
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })

      if (!uploadRes.ok) {
        setError('アップロードに失敗しました')
        setUploading(false)
        return
      }

      setMediaUrl(data.publicUrl)
    } catch {
      setError('アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = () => {
    if (!transactionId || !mediaUrl) return
    setError('')

    startTransition(async () => {
      const result = await createShowcase({
        transactionId,
        mediaUrl,
        mediaType,
        caption: caption || undefined,
      })

      if ('error' in result) {
        setError(result.error)
        return
      }

      router.push(`/transactions/${transactionId}?showcase=posted`)
    })
  }

  if (!transactionId) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-zinc-500">取引IDが指定されていません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">ショーケースに投稿</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          作品の切り抜きやプレビューをアップロードして、あなたの実績をアピールしましょう。
          依頼者の許可が確認済みの取引のみ投稿できます。
        </p>

        <div className="mt-6 space-y-6">
          {/* メディアタイプ選択 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              メディアの種類
            </label>
            <div className="mt-2 flex gap-2">
              {MEDIA_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setMediaType(t.value); setMediaUrl('') }}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    mediaType === t.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ファイルアップロード */}
          <div>
            <input
              ref={inputRef}
              type="file"
              accept={currentType.accept}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-lg border-2 border-dashed border-zinc-300 py-8 text-sm text-zinc-500 hover:border-orange-400 hover:text-orange-500 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-400"
            >
              {uploading ? 'アップロード中...' : `${currentType.label}ファイルを選択`}
            </button>
          </div>

          {/* プレビュー */}
          {mediaUrl && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="mb-2 text-xs font-medium text-zinc-500">プレビュー</p>
              {mediaType === 'image' && (
                <img src={mediaUrl} alt="プレビュー" className="max-h-64 w-full rounded-lg object-contain" />
              )}
              {mediaType === 'video' && (
                <video src={mediaUrl} controls className="max-h-64 w-full rounded-lg" />
              )}
              {mediaType === 'audio' && (
                <audio src={mediaUrl} controls className="w-full" />
              )}
            </div>
          )}

          {/* キャプション */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              キャプション（任意）
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="作品の簡単な説明"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* 投稿ボタン */}
          <button
            onClick={handleSubmit}
            disabled={isPending || !mediaUrl || uploading}
            className="w-full rounded-lg bg-orange-500 py-3 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? '投稿中...' : 'ショーケースに投稿する'}
          </button>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
