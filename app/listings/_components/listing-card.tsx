import Link from 'next/link'

type Props = {
  listing: {
    id: string
    title: string
    budget: number | null
    headcount: number
    deadline: string | null
    application_deadline: string | null
    status: string
    created_at: string
    client_username: string
    tags?: string[]
    specialties?: string[]
  }
}

export default function ListingCard({ listing }: Props) {
  const daysLeft = listing.application_deadline
    ? Math.ceil((new Date(listing.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block rounded-lg border border-zinc-200 p-4 transition-shadow hover:shadow-md dark:border-zinc-700"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">
          {listing.title}
        </h3>
        <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          listing.status === '募集中'
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : listing.status === '選考中'
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
        }`}>
          {listing.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
        {listing.budget === 0 ? (
          <span className="font-medium text-purple-600 dark:text-purple-400">無償依頼</span>
        ) : listing.budget ? (
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            ¥{listing.budget.toLocaleString()}〜
          </span>
        ) : (
          <span>予算 要相談</span>
        )}
        <span>募集 {listing.headcount}人</span>
        {listing.deadline ? (
          <span>納期 {listing.deadline}</span>
        ) : (
          <span>納期 要相談</span>
        )}
      </div>

      {((listing.specialties && listing.specialties.length > 0) || (listing.tags && listing.tags.length > 0)) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {listing.specialties?.map((spec) => (
            <span
              key={spec}
              className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            >
              {spec}
            </span>
          ))}
          {listing.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
        <span>{listing.client_username}</span>
        {daysLeft !== null && daysLeft >= 0 && (
          <span className={daysLeft <= 3 ? 'font-medium text-red-500' : ''}>
            {'\u{1F552}'} あと{daysLeft}日
          </span>
        )}
        {daysLeft !== null && daysLeft < 0 && (
          <span className="text-zinc-400">締切済み</span>
        )}
      </div>
    </Link>
  )
}
