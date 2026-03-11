'use client'

import type { OnboardingData } from '../actions'

type Props = {
  data: OnboardingData
  onChange: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export default function StepCreator({ data, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          クリエイター情報
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          あとから編集できます。スキップも可能です。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          自己紹介文
        </label>
        <textarea
          value={data.creatorBio}
          onChange={(e) => onChange({ creatorBio: e.target.value })}
          placeholder="得意なジャンルや制作スタイルなどを書いてみましょう"
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          受注ステータス
        </label>
        <div className="mt-2 flex gap-3">
          {(['受付中', '停止中'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onChange({ creatorStatus: status })}
              className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                data.creatorStatus === status
                  ? status === '受付中'
                    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'border-zinc-500 bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          通話可否
        </label>
        <div className="mt-2 flex gap-3">
          {(['不可', '可', '要相談'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onChange({ callOk: option })}
              className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                data.callOk === option
                  ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                  : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          戻る
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          次へ
        </button>
      </div>
    </div>
  )
}
