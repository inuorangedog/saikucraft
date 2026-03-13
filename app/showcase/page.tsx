import Link from 'next/link'
import { getShowcases } from './actions'

export const metadata = {
  title: 'ショーケース',
  description: 'SaikuCraftクリエイターの納品実績をご覧ください',
}

export default async function ShowcasePage() {
  const items = await getShowcases(48)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">ショーケース</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          クリエイターの納品実績。依頼者の許可を得た作品のみ掲載しています。
        </p>

        {items.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="group overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {item.media_type === 'image' && (
                    <img
                      src={item.media_url}
                      alt={item.caption || 'ショーケース'}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                  {item.media_type === 'video' && (
                    <video
                      src={item.media_url}
                      controls
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  )}
                  {item.media_type === 'audio' && (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                      <svg className="h-16 w-16 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                      <audio src={item.media_url} controls className="w-full" />
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <Link href={`/creators/${item.creator_id}`} className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                      {item.creator_avatar_url ? (
                        <img src={item.creator_avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        item.creator_username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium text-zinc-700 hover:text-orange-500 dark:text-zinc-300">
                      {item.creator_username}
                    </span>
                  </Link>
                  {item.caption && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.caption}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(item.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center text-sm text-zinc-400">
            まだショーケースの投稿はありません
          </div>
        )}
      </div>
    </div>
  )
}
