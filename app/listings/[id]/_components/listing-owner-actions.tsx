'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateListing, deleteListing } from '../../actions'

type Props = {
  listingId: string
  currentStatus: string
}

export default function ListingOwnerActions({ listingId, currentStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      setError('')
      const result = await updateListing(listingId, { status: newStatus })
      if ('error' in result) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('この募集を削除しますか？この操作は取り消せません。')) return
    startTransition(async () => {
      setError('')
      const result = await deleteListing(listingId)
      if ('error' in result) {
        setError(result.error)
      } else {
        window.location.href = '/listings'
      }
    })
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">募集の管理</h3>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => router.push(`/listings/${listingId}/edit`)}
          disabled={isPending}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          編集する
        </button>

        {currentStatus === '募集中' && (
          <button
            onClick={() => handleStatusChange('募集停止')}
            disabled={isPending}
            className="rounded-lg border border-yellow-300 px-3 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-950"
          >
            募集を停止
          </button>
        )}

        {currentStatus === '募集停止' && (
          <button
            onClick={() => handleStatusChange('募集中')}
            disabled={isPending}
            className="rounded-lg border border-green-300 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
          >
            募集を再開
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
        >
          削除する
        </button>
      </div>
    </div>
  )
}
