'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <p className="text-6xl font-bold text-red-500">500</p>
      <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
        エラーが発生しました
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        問題が解決しない場合は support@saikucraft.com までお問い合わせください。
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600"
        >
          もう一度試す
        </button>
        <a
          href="/"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          トップページへ
        </a>
      </div>
    </div>
  )
}
