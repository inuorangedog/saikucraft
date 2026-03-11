import { createClient } from '@/app/lib/supabase-server'
import TagManager from './_components/tag-manager'

export default async function AdminTagsPage() {
  const supabase = await createClient()

  const { data: tags } = await supabase
    .from('tags')
    .select('id, name, category')
    .order('category')
    .order('name')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">タグ管理</h1>
        <TagManager tags={tags || []} />
      </div>
    </div>
  )
}
