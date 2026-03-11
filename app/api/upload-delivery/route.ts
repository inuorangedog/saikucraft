import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase-server'
import { getUploadUrl, getPublicUrl } from '@/app/lib/r2'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/psd',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream', // PSD等のバイナリ
  'application/x-photoshop',
  'application/photoshop',
]

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'psd', 'zip']
const MAX_SIZE = 1024 * 1024 * 1024 // 1GB

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await req.json()
  const { contentType, fileSize, fileName, transactionId } = body as {
    contentType: string
    fileSize: number
    fileName: string
    transactionId: string
  }

  // 取引の当事者（クリエイター）であることを確認
  const { data: tx } = await supabase
    .from('transactions')
    .select('creator_id, status')
    .eq('id', transactionId)
    .single()

  if (!tx) {
    return NextResponse.json({ error: '取引が見つかりません' }, { status: 404 })
  }
  if (tx.creator_id !== user.id) {
    return NextResponse.json({ error: 'クリエイターのみがアップロードできます' }, { status: 403 })
  }
  if (tx.status !== '着手済み') {
    return NextResponse.json({ error: '納品可能なステータスではありません' }, { status: 400 })
  }

  // ファイル拡張子チェック
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: `対応していないファイル形式です（${ALLOWED_EXTENSIONS.join(', ')}）` }, { status: 400 })
  }

  if (fileSize > MAX_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは1GB以下にしてください' }, { status: 400 })
  }

  const key = `delivery/${transactionId}/${uuidv4()}.${ext}`
  const uploadUrl = await getUploadUrl(key, contentType)
  const publicUrl = getPublicUrl(key)

  return NextResponse.json({ uploadUrl, publicUrl, key })
}
