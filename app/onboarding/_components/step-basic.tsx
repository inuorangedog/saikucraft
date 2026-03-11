'use client'

import { useState } from 'react'
import { checkUsername } from '../actions'
import type { OnboardingData } from '../actions'

type Props = {
  data: OnboardingData
  onChange: (data: Partial<OnboardingData>) => void
  onNext: () => void
}

export default function StepBasic({ data, onChange, onNext }: Props) {
  const [usernameError, setUsernameError] = useState('')
  const [checking, setChecking] = useState(false)

  const isValid = data.username.trim() && data.isAgeVerified && data.isHumanVerified && !usernameError

  const handleUsernameBlur = async () => {
    const name = data.username.trim()
    if (!name) return
    setChecking(true)
    const { available } = await checkUsername(name)
    if (!available) {
      setUsernameError('このユーザー名は既に使われています')
    } else {
      setUsernameError('')
    }
    setChecking(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          基本情報
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          まずはあなたの情報を教えてください
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          ユーザー名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.username}
          onChange={(e) => {
            onChange({ username: e.target.value })
            setUsernameError('')
          }}
          onBlur={handleUsernameBlur}
          placeholder="例: sakura_art"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        {checking && (
          <p className="mt-1 text-xs text-zinc-500">確認中...</p>
        )}
        {usernameError && (
          <p className="mt-1 text-xs text-red-500">{usernameError}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isAgeVerified}
            onChange={(e) => onChange({ isAgeVerified: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            18歳以上です <span className="text-red-500">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isHumanVerified}
            onChange={(e) => onChange({ isHumanVerified: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            人間が制作した作品のみ出品します <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        次へ
      </button>
    </div>
  )
}
