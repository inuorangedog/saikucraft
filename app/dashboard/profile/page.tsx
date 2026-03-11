import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import ProfileEditForm from './_components/profile-edit-form'
import { getAllTags, getCreatorTags } from '@/app/lib/tags'
import { getAllEvents, getUserEvents } from '@/app/lib/events'
import { getAllSpecialties, getCreatorSpecialtyIds } from '@/app/lib/specialties'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, user_type, avatar_url')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('bio, status, call_ok, max_revisions, ng_content, is_r18_ok, is_commercial_ok, is_urgent_ok, twitter_url, pixiv_url, misskey_url')
    .eq('user_id', user.id)
    .single()

  const allTags = await getAllTags()
  const creatorTags = creatorProfile ? await getCreatorTags(user.id) : []
  const allEvents = await getAllEvents()
  const userEvents = await getUserEvents(user.id)
  const allSpecialties = await getAllSpecialties()
  const creatorSpecialtyIds = creatorProfile ? await getCreatorSpecialtyIds(user.id) : []

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          プロフィール編集
        </h1>
        <ProfileEditForm
          profile={profile}
          creatorProfile={creatorProfile}
          allTags={allTags}
          initialTagIds={creatorTags.map((t) => t.id)}
          allEvents={allEvents}
          initialEventIds={userEvents.map((e) => e.id)}
          allSpecialties={allSpecialties}
          initialSpecialtyIds={creatorSpecialtyIds}
        />
      </div>
    </div>
  )
}
