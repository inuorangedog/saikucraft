'use client'

import type { OnboardingData } from '../actions'

type Props = {
  data: OnboardingData
  onChange: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export default function StepClient({ data, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          依頼者情報
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          あとから編集できます。スキップも可能です。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          自己紹介文（任意）
        </label>
        <textarea
          value={data.clientBio}
          onChange={(e) => onChange({ clientBio: e.target.value })}
          placeholder="どんな依頼を考えているかなど、自由に書いてください"
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
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
