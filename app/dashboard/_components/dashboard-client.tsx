'use client'

import { useState } from 'react'
import Link from 'next/link'
import ModeSwitcher from './mode-switcher'
import CreatorDashboard from './creator-dashboard'
import ClientDashboard from './client-dashboard'
import { createClient } from '@/app/lib/supabase'

type Profile = {
  username: string
  user_type: string
  avatar_url: string | null
}

type CreatorProfile = {
  bio: string | null
  status: string
  call_ok: string
  max_revisions: number
  is_r18_ok: boolean
  is_commercial_ok: boolean
  is_urgent_ok: boolean
}

type Transaction = {
  id: string
  status: string
  amount: number
  created_at: string
}

type Listing = {
  id: string
  title: string
  status: string
  created_at: string
}

type Application = {
  id: string
  listingId: string
  listingTitle: string
  status: string
  createdAt: string
}

type Props = {
  profile: Profile
  creatorProfile: CreatorProfile | null
  unreadCount: number
  creatorTransactions: Transaction[]
  clientTransactions: Transaction[]
  monthlyRevenue: number
  myApplications: Application[]
  myListings: Listing[]
  totalPaid: number
}

export default function DashboardClient({
  profile,
  creatorProfile: initialCreatorProfile,
  unreadCount,
  creatorTransactions,
  clientTransactions,
  monthlyRevenue,
  myApplications,
  myListings,
  totalPaid,
}: Props) {
  const defaultMode = profile.user_type === 'client' ? 'client' as const : 'creator' as const
  const [mode, setMode] = useState<'creator' | 'client'>(defaultMode)
  const [creatorProfile, setCreatorProfile] = useState(initialCreatorProfile)

  const isCreatorMode = mode === 'creator'
  const borderColor = isCreatorMode ? 'border-orange-200 dark:border-orange-800' : 'border-blue-200 dark:border-blue-800'
  const accentColor = isCreatorMode ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'

  const handleStatusChange = (newStatus: string) => {
    if (creatorProfile) {
      setCreatorProfile({ ...creatorProfile, status: newStatus })
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${accentColor}`}>
            {profile.username}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isCreatorMode ? 'クリエイターモード' : '依頼者モード'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/notifications"
            className="relative rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/profile"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            プロフィール編集
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* モード切り替え */}
      <ModeSwitcher mode={mode} userType={profile.user_type} onSwitch={setMode} />

      {/* アカウント設定 */}
      <div className="flex justify-end gap-4">
        <Link
          href="/dashboard/blocks"
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          ブロックリスト
        </Link>
        <Link
          href="/dashboard/settings/delete"
          className="text-xs text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
        >
          アカウント退会
        </Link>
      </div>

      {/* コンテンツ */}
      {isCreatorMode && (profile.user_type === 'creator' || profile.user_type === 'both') ? (
        <CreatorDashboard
          creatorProfile={creatorProfile}
          onStatusChange={handleStatusChange}
          transactions={creatorTransactions}
          monthlyRevenue={monthlyRevenue}
          applications={myApplications}
        />
      ) : (
        <ClientDashboard
          username={profile.username}
          transactions={clientTransactions}
          listings={myListings}
          totalPaid={totalPaid}
        />
      )}
    </div>
  )
}
