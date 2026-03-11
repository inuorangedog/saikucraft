import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase-server'
import { getUploadUrl, getPublicUrl } from '@/app/lib/r2'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

type UploadCategory = 'avatar' | 'portfolio' | 'message'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await req.json()
  const { contentType, fileSize, category } = body as {
    contentType: string
    fileSize: number
    category: UploadCategory
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: '許可されていないファイル形式です（JPEG, PNG, WebP のみ）' }, { status: 400 })
  }

  if (fileSize > MAX_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 })
  }

  const ext = contentType.split('/')[1].replace('jpeg', 'jpg')
  const key = `${category}/${user.id}/${uuidv4()}.${ext}`

  const uploadUrl = await getUploadUrl(key, contentType)
  const publicUrl = getPublicUrl(key)

  return NextResponse.json({ uploadUrl, publicUrl, key })
}
