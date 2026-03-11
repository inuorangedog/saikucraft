import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import ListingForm from './_components/listing-form'
import { getAllTags } from '@/app/lib/tags'
import { getUpcomingEvents } from '@/app/lib/events'
import { getAllSpecialties } from '@/app/lib/specialties'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '募集を作成',
}

export default async function NewListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const allTags = await getAllTags()
  const allEvents = await getUpcomingEvents()
  const allSpecialties = await getAllSpecialties()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          募集を作成
        </h1>
        <ListingForm allTags={allTags} allEvents={allEvents} allSpecialties={allSpecialties} />
      </div>
    </div>
  )
}
