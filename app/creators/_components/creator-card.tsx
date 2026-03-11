import Link from 'next/link'

type Props = {
  creator: {
    user_id: string
    username: string
    avatar_url: string | null
    bio: string | null
    status: string
    call_ok: string
    is_r18_ok: boolean
    is_commercial_ok: boolean
    is_urgent_ok: boolean
    created_at: string
    isBoosted?: boolean
    tags?: string[]
    minPrice?: number | null
  }
}

export default function CreatorCard({ creator }: Props) {
  // 登録1週間以内なら新着
  const isNew = Date.now() - new Date(creator.created_at).getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <Link
      href={`/creators/${creator.user_id}`}
      className="block rounded-lg border border-zinc-200 p-4 transition-shadow hover:shadow-md dark:border-zinc-700"
    >
      <div className="flex items-start gap-3">
        {/* アイコン */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            creator.username.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* 名前 + バッジ */}
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-zinc-900 dark:text-zinc-50">
              {creator.username}
            </h3>
            {creator.isBoosted && (
              <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                人気
              </span>
            )}
            {isNew && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                NEW
              </span>
            )}
          </div>

          {/* ステータス */}
          <p className={`mt-0.5 text-xs font-medium ${
            creator.status === '受付中'
              ? 'text-green-600 dark:text-green-400'
              : 'text-zinc-400 dark:text-zinc-500'
          }`}>
            {creator.status}
          </p>

          {/* 最低単価 */}
          {creator.minPrice != null && (
            <p className="mt-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              ¥{creator.minPrice.toLocaleString()}〜
            </p>
          )}

          {/* bio（切り詰め） */}
          {creator.bio && (
            <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {creator.bio}
            </p>
          )}

          {/* 得意タグ */}
          {creator.tags && creator.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {creator.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded bg-orange-50 px-1.5 py-0.5 text-xs text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                  {tag}
                </span>
              ))}
              {creator.tags.length > 3 && (
                <span className="text-xs text-zinc-400">+{creator.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* フラグ */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {creator.is_r18_ok && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">R18可</span>
            )}
            {creator.is_commercial_ok && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">商業可</span>
            )}
            {creator.is_urgent_ok && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">急ぎ対応可</span>
            )}
            {creator.call_ok !== '不可' && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300">通話{creator.call_ok}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
