'use client'

import { useState, useRef } from 'react'

type Props = {
  transactionId: string
  onUploaded: (data: { url: string; fileName: string; key: string }) => void
}

async function saveDeliveryFile(
  transactionId: string,
  data: { url: string; fileName: string; key: string }
) {
  const res = await fetch('/api/save-delivery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionId,
      deliveryFileUrl: data.url,
      deliveryFileName: data.fileName,
      deliveryFileKey: data.key,
    }),
  })
  return res.ok
}

export default function DeliveryUpload({ transactionId, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setFileName(file.name)
    setUploading(true)
    setProgress(0)

    try {
      // 1. Presigned URLを取得
      const res = await fetch('/api/upload-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileName: file.name,
          transactionId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'アップロードの準備に失敗しました')
        setUploading(false)
        return
      }

      // 2. XMLHttpRequestでR2に直接アップロード（最大3回リトライ・進捗表示）
      const uploadWithRetry = (attempt: number): Promise<void> =>
        new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              setProgress(Math.round((event.loaded / event.total) * 100))
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else if (attempt < 3) {
              setProgress(0)
              setTimeout(() => uploadWithRetry(attempt + 1).then(resolve, reject), 1000 * attempt)
            } else {
              reject(new Error('アップロードに失敗しました'))
            }
          })

          xhr.addEventListener('error', () => {
            if (attempt < 3) {
              setProgress(0)
              setTimeout(() => uploadWithRetry(attempt + 1).then(resolve, reject), 1000 * attempt)
            } else {
              reject(new Error('ネットワークエラー'))
            }
          })

          xhr.addEventListener('abort', () => reject(new Error('アップロードがキャンセルされました')))

          xhr.open('PUT', data.uploadUrl)
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
          xhr.send(file)
        })

      await uploadWithRetry(1)

      const fileData = { url: data.publicUrl, fileName: file.name, key: data.key }

      // R2アップロード完了後、即座にDBに保存
      const saved = await saveDeliveryFile(transactionId, fileData)
      if (!saved) {
        setError('ファイル情報の保存に失敗しました')
        setUploading(false)
        return
      }

      onUploaded(fileData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".zip,.rar,.7z,.psd,.ai,.eps,.pdf,.indd,.clip,.lip,.sai,.sai2,.mdp,.kra,.xcf,.procreate,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.tif,.svg,.doc,.docx,.txt,.rtf"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-lg border-2 border-dashed border-zinc-300 py-4 text-sm text-zinc-500 hover:border-orange-400 hover:text-orange-500 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-400"
      >
        {uploading ? 'アップロード中...' : '納品ファイルを選択（ZIP, PSD, CLIP, AI, DOCX等 最大1GB）'}
      </button>

      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="truncate max-w-[200px]">{fileName}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
