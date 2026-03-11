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

const MIGRATIONS = [
  {
    name: 'add_creator_external_links',
    sql: `
      ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS twitter_url text;
      ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS pixiv_url text;
      ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS misskey_url text;
    `,
  },
  {
    name: 'add_dispute_columns',
    sql: `
      ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS dispute_resolution text;
      ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS dispute_admin_note text;
      ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS dispute_resolved_at timestamptz;
    `,
  },
  {
    name: 'add_stripe_customer_id',
    sql: `
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
    `,
  },
]

async function apply() {
  for (const m of MIGRATIONS) {
    console.log(`Applying: ${m.name}`)
    const { error } = await supabase.rpc('exec_sql', { sql: m.sql })
    if (error) {
      // rpcが無い場合は個別にやる
      console.log(`  rpc failed, trying individual statements...`)
      const statements = m.sql.split(';').map(s => s.trim()).filter(Boolean)
      for (const stmt of statements) {
        const { error: e2 } = await supabase.from('_migrations_dummy').select('*').limit(0)
        // Supabase JSクライアントではDDLを直接実行できないので、REST APIで実行
        const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY!}`,
          },
          body: JSON.stringify({ sql: stmt }),
        })
        if (!res.ok) {
          console.log(`  Statement failed: ${stmt.substring(0, 60)}...`)
          console.log(`  Response: ${await res.text()}`)
        } else {
          console.log(`  OK: ${stmt.substring(0, 60)}...`)
        }
      }
    } else {
      console.log(`  OK`)
    }
  }
  console.log('Done!')
}

apply().catch(console.error)
