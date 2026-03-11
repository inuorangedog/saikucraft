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
  const { data, error } = await supabase.from('creator_profiles').select('twitter_url').limit(1)
  if (error) {
    console.log('ERROR:', error.message)
  } else {
    console.log('OK - twitter_url column exists')
  }

  // portfoliosテーブル
  const { error: e2 } = await supabase.from('portfolios').select('id').limit(1)
  if (e2) console.log('portfolios ERROR:', e2.message)
  else console.log('OK - portfolios table exists')

  // stripe_customer_id
  const { error: e3 } = await supabase.from('profiles').select('stripe_customer_id').limit(1)
  if (e3) console.log('stripe_customer_id ERROR:', e3.message)
  else console.log('OK - stripe_customer_id exists')

  // dispute columns
  const { error: e4 } = await supabase.from('transactions').select('dispute_resolution').limit(1)
  if (e4) console.log('dispute_resolution ERROR:', e4.message)
  else console.log('OK - dispute columns exist')

  // auto_refund_at
  const { error: e5 } = await supabase.from('transactions').select('auto_refund_at').limit(1)
  if (e5) console.log('auto_refund_at ERROR:', e5.message)
  else console.log('OK - auto_refund_at exists')
}
check()
