'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/app/lib/supabase'
import { sendMessage } from '../../actions'
import ImageUpload from '@/app/_components/image-upload'

type Message = {
  id: string
  sender_id: string
  content: string | null
  image_urls: string[] | null
  created_at: string
}

type Props = {
  transactionId: string
  currentUserId: string
  initialMessages: Message[]
  creatorName: string
  clientName: string
  creatorId: string
  clientId: string
}

export default function MessagePanel({
  transactionId,
  currentUserId,
  initialMessages,
  creatorName,
  clientName,
  creatorId,
  clientId,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  const getSenderName = (senderId: string) => {
    if (senderId === creatorId) return creatorName
    if (senderId === clientId) return clientName
    return '不明'
  }

  // Supabase Realtime でメッセージを購読
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `transaction_id=eq.${transactionId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [transactionId])

  // 新メッセージで自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() && imageUrls.length === 0) return
    const content = input
    const images = [...imageUrls]
    setInput('')
    setImageUrls([])
    setShowImageUpload(false)
    startTransition(async () => {
      await sendMessage(transactionId, content || null, images.length > 0 ? images : null)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <h2 className="shrink-0 border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
        メッセージ
      </h2>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-400">メッセージはまだありません</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] space-y-1`}>
                <p className={`text-xs ${isMe ? 'text-right' : 'text-left'} text-zinc-400`}>
                  {getSenderName(msg.sender_id)}
                </p>
                <div className={`rounded-lg px-3 py-2 text-sm ${
                  isMe
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                }`}>
                  {msg.content && (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.image_urls && msg.image_urls.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {msg.image_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="" className="max-w-full rounded" style={{ maxHeight: '200px' }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <p className={`text-xs text-zinc-400 ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-700">
        {/* 添付画像プレビュー */}
        {imageUrls.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
                <button
                  onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 画像アップロード */}
        {showImageUpload && (
          <div className="mb-2">
            <ImageUpload
              category="message"
              onUpload={(url) => {
                setImageUrls((prev) => {
                  if (prev.length >= 3) return prev
                  return [...prev, url]
                })
                setShowImageUpload(false)
              }}
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowImageUpload(!showImageUpload)}
            disabled={imageUrls.length >= 3}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            title={imageUrls.length >= 3 ? '画像は3枚までです' : '画像を添付'}
          >
            +{imageUrls.length > 0 ? ` ${imageUrls.length}/3` : ''}
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            onClick={handleSend}
            disabled={isPending || (!input.trim() && imageUrls.length === 0)}
            className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  )
}
