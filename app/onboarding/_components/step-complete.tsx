import type { OnboardingData } from '../actions'

type Props = {
  data: OnboardingData
}

export default function StepComplete({ data }: Props) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          登録完了!
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          ようこそ、{data.username}さん
        </p>
      </div>

      <div className="space-y-3">
        {(data.userType === 'client' || data.userType === 'both') && (
          <>
            <a
              href="/dashboard"
              className="block w-full rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              クリエイターを探す
            </a>
            <a
              href="/dashboard"
              className="block w-full rounded-lg border border-blue-300 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
            >
              募集を投稿する
            </a>
          </>
        )}
        {(data.userType === 'creator' || data.userType === 'both') && (
          <>
            <a
              href="/dashboard"
              className="block w-full rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              募集案件を探す
            </a>
            <a
              href="/dashboard"
              className="block w-full rounded-lg border border-orange-300 py-2.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
            >
              プロフィールを充実させる
            </a>
          </>
        )}
      </div>
    </div>
  )
}
