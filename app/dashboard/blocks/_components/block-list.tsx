'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toggleBlock } from '@/app/_components/block-action'

type BlockItem = {
  id: string
  blockedId: string
  username: string
  avatarUrl: string | null
  createdAt: string
}

type Props = {
  initialItems: BlockItem[]
}

export default function BlockList({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleUnblock = (blockedId: string, username: string) => {
    if (!confirm(`${username}のブロックを解除しますか？`)) return
    startTransition(async () => {
      const result = await toggleBlock(blockedId)
      if ('isBlocked' in result && !result.isBlocked) {
        setItems((prev) => prev.filter((item) => item.blockedId !== blockedId))
      }
    })
  }

  return (
    <div className="mt-6">
      {items.length === 0 ? (
        <p className="text-center text-sm text-zinc-400 py-12">ブロックしているユーザーはいません</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    item.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.username}</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(item.createdAt).toLocaleDateString('ja-JP')}にブロック
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUnblock(item.blockedId, item.username)}
                disabled={isPending}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                ブロック解除
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← ダッシュボードに戻る
        </button>
      </div>
    </div>
  )
}
