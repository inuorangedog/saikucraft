'use server'

import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createTag(data: {
  name: string
  category: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = getAdminClient()

  const { error } = await supabase.from('tags').insert({
    name: data.name.trim(),
    category: data.category.trim(),
  })

  if (error) return { error: `作成に失敗しました: ${error.message}` }
  return { success: true }
}

export async function deleteTag(id: string): Promise<{ error: string } | { success: true }> {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)

  if (error) return { error: `削除に失敗しました: ${error.message}` }
  return { success: true }
}
