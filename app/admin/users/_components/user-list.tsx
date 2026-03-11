'use client'

import { useTransition, useState } from 'react'
import { suspendUser, restoreUser } from '../../actions'

type User = {
  user_id: string
  username: string
  display_name: string | null
  role: string
  deleted_at: string | null
  created_at: string
}

export default function UserList({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = search
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          (u.display_name && u.display_name.toLowerCase().includes(search.toLowerCase()))
      )
    : users

  const handleSuspend = (userId: string) => {
    if (!confirm('このユーザーを停止しますか？')) return
    startTransition(async () => {
      const result = await suspendUser(userId)
      if ('success' in result) {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === userId ? { ...u, deleted_at: new Date().toISOString() } : u
          )
        )
      }
    })
  }

  const handleRestore = (userId: string) => {
    startTransition(async () => {
      const result = await restoreUser(userId)
      if ('success' in result) {
        setUsers((prev) =>
          prev.map((u) => (u.user_id === userId ? { ...u, deleted_at: null } : u))
        )
      }
    })
  }

  return (
    <div>
      <div className="mt-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ユーザー名で検索..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-zinc-400">ユーザーが見つかりません</p>
        )}
        {filtered.map((user) => (
          <div
            key={user.user_id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {user.display_name || user.username}
                </p>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">@{user.username}</span>
                {user.role === 'admin' && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    管理者
                  </span>
                )}
                {user.deleted_at && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                    停止中
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                登録日: {new Date(user.created_at).toLocaleDateString('ja-JP')}
                {' ・ '}ID: {user.user_id.slice(0, 8)}...
              </p>
            </div>
            <div>
              {user.role !== 'admin' && (
                user.deleted_at ? (
                  <button
                    onClick={() => handleRestore(user.user_id)}
                    disabled={isPending}
                    className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    復旧
                  </button>
                ) : (
                  <button
                    onClick={() => handleSuspend(user.user_id)}
                    disabled={isPending}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    停止
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
