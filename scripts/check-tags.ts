import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
  const { data: tags, error } = await supabase.from('tags').select('id, name, category').order('category').order('name')
  if (error) { console.error(error); return }
  console.log(`Tags: ${tags.length}`)
  const byCategory = new Map<string, string[]>()
  for (const t of tags) {
    const list = byCategory.get(t.category) || []
    list.push(t.name)
    byCategory.set(t.category, list)
  }
  for (const [cat, names] of byCategory) {
    console.log(`  ${cat}: ${names.join(', ')}`)
  }
}
check()
