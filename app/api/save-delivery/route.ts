import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { transactionId, deliveryFileUrl, deliveryFileName, deliveryFileKey } = await req.json()

  // クリエイターであることを確認
  const { data: tx } = await supabase
    .from('transactions')
    .select('creator_id, status')
    .eq('id', transactionId)
    .single()

  if (!tx) {
    return NextResponse.json({ error: '取引が見つかりません' }, { status: 404 })
  }
  if (tx.creator_id !== user.id) {
    return NextResponse.json({ error: 'クリエイターのみが実行できます' }, { status: 403 })
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      delivery_file_url: deliveryFileUrl,
      delivery_file_name: deliveryFileName,
      delivery_file_key: deliveryFileKey,
    })
    .eq('id', transactionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
