'use client'

type Props = {
  mode: 'creator' | 'client'
  userType: string
  onSwitch: (mode: 'creator' | 'client') => void
}

export default function ModeSwitcher({ mode, userType, onSwitch }: Props) {
  if (userType !== 'both') return null

  return (
    <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
      <button
        onClick={() => onSwitch('creator')}
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          mode === 'creator'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        クリエイター
      </button>
      <button
        onClick={() => onSwitch('client')}
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          mode === 'client'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        依頼者
      </button>
    </div>
  )
}
