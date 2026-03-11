export default function CreatorsLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-6 flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-20 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex gap-1">
                    <div className="h-5 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-5 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
