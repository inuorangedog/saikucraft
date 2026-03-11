'use client'

import { useTransition, useState } from 'react'
import { toggleBlock } from './block-action'

type Props = {
  targetId: string
  initialBlocked: boolean
}

export default function BlockButton({ targetId, initialBlocked }: Props) {
  const [isBlocked, setIsBlocked] = useState(initialBlocked)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    if (!isBlocked && !confirm('このユーザーをブロックしますか？ブロックすると、相手からの指名依頼やメッセージが届かなくなります。')) {
      return
    }
    startTransition(async () => {
      const result = await toggleBlock(targetId)
      if ('isBlocked' in result) {
        setIsBlocked(result.isBlocked)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`text-sm ${
        isBlocked
          ? 'text-red-500 hover:text-red-600'
          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
      }`}
    >
      {isPending ? '...' : isBlocked ? 'ブロック解除' : 'ブロック'}
    </button>
  )
}
