'use client'

import type { OnboardingData } from '../actions'

type Props = {
  data: OnboardingData
  onChange: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const roles = [
  {
    value: 'client' as const,
    label: '依頼者として使う',
    description: 'イラストやデザインを依頼したい',
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  },
  {
    value: 'creator' as const,
    label: 'クリエイターとして使う',
    description: '制作を受注したい',
    color: 'border-orange-500 bg-orange-50 dark:bg-orange-950',
  },
  {
    value: 'both' as const,
    label: '両方',
    description: '依頼もクリエイターもやりたい',
    color: 'border-purple-500 bg-purple-50 dark:bg-purple-950',
  },
]

export default function StepRole({ data, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          使い方を選ぶ
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          あとから変更できます
        </p>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => onChange({ userType: role.value })}
            className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
              data.userType === role.value
                ? role.color
                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
            }`}
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {role.label}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {role.description}
            </p>
          </button>
        ))}
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
