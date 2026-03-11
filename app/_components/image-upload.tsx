'use client'

import { useState, useRef, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'

type Props = {
  category: 'avatar' | 'portfolio' | 'message'
  onUpload: (url: string) => void
  currentUrl?: string
  className?: string
  label?: string
}

async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = reject
    image.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/jpeg', 0.9)
  })
}

export default function ImageUpload({ category, onUpload, currentUrl, className, label }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cropper state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  function handleFileSelect(file: File) {
    setError(null)
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください')
      return
    }

    if (category === 'avatar') {
      const reader = new FileReader()
      reader.onload = () => {
        setCropSrc(reader.result as string)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
      }
      reader.readAsDataURL(file)
    } else {
      uploadFile(file)
    }
  }

  async function handleCropConfirm() {
    if (!cropSrc || !croppedAreaPixels) return
    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels)
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      setCropSrc(null)
      await uploadFile(file)
    } catch {
      setError('トリミングに失敗しました')
    }
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type,
          fileSize: file.size,
          category,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'アップロードに失敗しました')
      }

      const { uploadUrl, publicUrl } = await res.json()

      let uploadSuccess = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          })
          if (uploadRes.ok) {
            uploadSuccess = true
            break
          }
          if (attempt === 3) throw new Error('アップロードに失敗しました')
        } catch (uploadErr) {
          if (attempt === 3) throw uploadErr
          await new Promise((r) => setTimeout(r, 1000 * attempt))
        }
      }

      if (!uploadSuccess) {
        throw new Error('アップロードに失敗しました')
      }

      setPreview(publicUrl)
      onUpload(publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      {/* Crop modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-lg bg-white p-4 dark:bg-zinc-900">
            <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              画像を調整
            </p>
            <div className="relative h-72 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-zinc-500">-</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-zinc-500">+</span>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setCropSrc(null)}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                この範囲で決定
              </button>
            </div>
          </div>
        </div>
      )}

      {category === 'avatar' && preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {uploading ? 'アップロード中...' : '画像を変更する'}
        </button>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 transition hover:border-orange-400 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-orange-500"
          style={{ minHeight: category === 'avatar' ? '96px' : '120px' }}
        >
          <div className="p-4 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {uploading ? 'アップロード中...' : 'クリックして画像を選択'}
            </p>
            <p className="mt-1 text-xs text-zinc-400">JPEG, PNG, WebP（5MB以下）</p>
          </div>

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-zinc-900/70">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          if (inputRef.current) inputRef.current.value = ''
        }}
      />

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
