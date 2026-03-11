import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase-server'
import { getAllTags, getListingTagIds } from '@/app/lib/tags'
import { getUpcomingEvents } from '@/app/lib/events'
import { getAllSpecialties, getListingSpecialtyIds } from '@/app/lib/specialties'
import ListingEditForm from './_components/listing-edit-form'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ListingEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: listing } = await supabase
    .from('listings')
    .select('id, client_id, title, description, budget, headcount, deadline, application_deadline, event_id')
    .eq('id', id)
    .single()

  if (!listing) notFound()
  if (listing.client_id !== user.id) redirect(`/listings/${id}`)

  const allTags = await getAllTags()
  const allEvents = await getUpcomingEvents()
  const allSpecialties = await getAllSpecialties()
  const initialTagIds = await getListingTagIds(id)
  const initialSpecialtyIds = await getListingSpecialtyIds(id)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          募集を編集
        </h1>
        <div className="mt-6">
          <ListingEditForm
            listing={listing}
            allTags={allTags}
            allEvents={allEvents}
            allSpecialties={allSpecialties}
            initialTagIds={initialTagIds}
            initialSpecialtyIds={initialSpecialtyIds}
          />
        </div>
      </div>
    </div>
  )
}
