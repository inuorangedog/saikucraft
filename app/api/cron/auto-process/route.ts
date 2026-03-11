import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, PLATFORM_FEE_PERCENT } from '@/app/lib/stripe'
import { createNotification } from '@/app/lib/notifications'
import { deleteFile } from '@/app/lib/r2'

// Service Role Keyでアクセス（Cron Jobsはユーザー認証なし）
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  // Vercel Cron Jobsの認証（CRON_SECRETが設定されていれば検証）
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  const now = new Date().toISOString()
  const results = { autoApproved: 0, autoRefunded: 0, autoDeclined: 0, imagesDeleted: 0, listingsExpired: 0, errors: [] as string[] }

  // ① 納品後3日経過 → 自動承認・送金
  const { data: approveTargets } = await supabase
    .from('transactions')
    .select('id, amount, creator_id, client_id, stripe_payment_intent_id, payment_status')
    .eq('status', '納品済み')
    .eq('payment_status', 'paid')
    .lte('auto_approve_at', now)

  for (const tx of approveTargets || []) {
    try {
      // ステータスを完了に更新
      await supabase
        .from('transactions')
        .update({ status: '完了' })
        .eq('id', tx.id)

      // クリエイターに送金
      const { data: cp } = await supabase
        .from('creator_profiles')
        .select('stripe_account_id, stripe_onboarded')
        .eq('user_id', tx.creator_id)
        .single()

      if (cp?.stripe_account_id && cp.stripe_onboarded && tx.stripe_payment_intent_id) {
        const fee = Math.ceil(tx.amount * PLATFORM_FEE_PERCENT / 100)
        const transferAmount = tx.amount - fee

        const pi = await stripe.paymentIntents.retrieve(tx.stripe_payment_intent_id)
        const transfer = await stripe.transfers.create({
          amount: transferAmount,
          currency: 'jpy',
          destination: cp.stripe_account_id,
          source_transaction: pi.latest_charge as string,
          metadata: { transaction_id: tx.id, fee_amount: fee.toString() },
        })

        await supabase
          .from('transactions')
          .update({ payment_status: 'transferred', stripe_transfer_id: transfer.id })
          .eq('id', tx.id)
      }

      // 両者に通知
      createNotification({
        userId: tx.client_id,
        type: 'status_change',
        title: '取引が自動承認されました',
        body: '納品後3日が経過したため、自動的に承認されました。',
        relatedId: tx.id,
      })
      createNotification({
        userId: tx.creator_id,
        type: 'status_change',
        title: '取引が自動承認されました',
        body: '報酬が送金されます。',
        relatedId: tx.id,
      })

      results.autoApproved++
    } catch (e) {
      results.errors.push(`auto-approve ${tx.id}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // ② 締め切り3日超過で未納品 → 自動返金（auto_refund_atを使用）
  const { data: refundTargets } = await supabase
    .from('transactions')
    .select('id, amount, creator_id, client_id, stripe_payment_intent_id, payment_status')
    .in('status', ['取引開始', 'ラフ提出待ち', 'ラフ確認中', '詳細ラフ確認中', '着手済み'])
    .eq('payment_status', 'paid')
    .not('auto_refund_at', 'is', null)
    .lte('auto_refund_at', now)

  for (const tx of refundTargets || []) {
    try {
      // 全額返金
      if (tx.stripe_payment_intent_id) {
        const refund = await stripe.refunds.create({
          payment_intent: tx.stripe_payment_intent_id,
          metadata: { transaction_id: tx.id, reason: 'deadline_exceeded' },
        })

        await supabase
          .from('transactions')
          .update({
            status: '完了',
            payment_status: 'refunded',
            stripe_refund_id: refund.id,
          })
          .eq('id', tx.id)
      }

      // 両者に通知
      createNotification({
        userId: tx.client_id,
        type: 'status_change',
        title: '締め切り超過により自動返金されました',
        body: '全額が返金されます。',
        relatedId: tx.id,
      })
      createNotification({
        userId: tx.creator_id,
        type: 'status_change',
        title: '締め切り超過により取引がキャンセルされました',
        body: '締め切りから3日以上経過したため、自動的にキャンセルされました。',
        relatedId: tx.id,
      })

      // ペナルティ: deadline_exceeded_countをインクリメント
      const { data: cp } = await supabase
        .from('creator_profiles')
        .select('deadline_exceeded_count')
        .eq('user_id', tx.creator_id)
        .single()

      const newCount = (cp?.deadline_exceeded_count ?? 0) + 1
      const updatePayload: Record<string, unknown> = { deadline_exceeded_count: newCount }

      // 3回以上でアカウント停止
      if (newCount >= 3) {
        updatePayload.status = '停止中'
        createNotification({
          userId: tx.creator_id,
          type: 'status_change',
          title: 'アカウントが停止されました',
          body: '締め切り超過が3回に達したため、アカウントが停止されました。',
          relatedId: tx.id,
        })
      }

      await supabase
        .from('creator_profiles')
        .update(updatePayload)
        .eq('user_id', tx.creator_id)

      results.autoRefunded++
    } catch (e) {
      results.errors.push(`auto-refund ${tx.id}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // ③ 交渉3日無返答 → 自動辞退
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const { data: staleNegotiations } = await supabase
    .from('negotiations')
    .select('id, creator_id, client_id, created_at')
    .eq('status', '交渉中')
    .lte('created_at', threeDaysAgo)

  for (const neg of staleNegotiations || []) {
    try {
      // 最新メッセージを確認（3日以内にやりとりがあればスキップ）
      const { data: lastMsg } = await supabase
        .from('negotiation_messages')
        .select('created_at')
        .eq('negotiation_id', neg.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const lastActivity = lastMsg?.created_at || neg.created_at
      if (new Date(lastActivity) > new Date(threeDaysAgo)) continue

      // 自動辞退
      await supabase
        .from('negotiations')
        .update({ status: '辞退' })
        .eq('id', neg.id)

      // クールダウン設定
      await supabase.from('negotiation_cooldowns').insert({
        client_id: neg.client_id,
        creator_id: neg.creator_id,
        available_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })

      // 両者に通知
      createNotification({
        userId: neg.client_id,
        type: 'status_change',
        title: '指名依頼が自動辞退されました',
        body: '3日間返答がなかったため、自動的に辞退されました。',
        relatedId: neg.id,
      })
      createNotification({
        userId: neg.creator_id,
        type: 'status_change',
        title: '指名依頼が自動辞退されました',
        body: '3日間未返答のため、自動的に辞退処理されました。',
        relatedId: neg.id,
      })

      results.autoDeclined++
    } catch (e) {
      results.errors.push(`auto-decline ${neg.id}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // ④ 退会後30日経過 → R2画像自動削除
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: deletedUsers } = await supabase
    .from('profiles')
    .select('user_id, avatar_url')
    .not('deleted_at', 'is', null)
    .lte('deleted_at', thirtyDaysAgo)
    .not('avatar_url', 'is', null)

  for (const du of deletedUsers || []) {
    try {
      // アバター画像削除
      if (du.avatar_url) {
        const key = extractR2Key(du.avatar_url)
        if (key) {
          await deleteFile(key)
          results.imagesDeleted++
        }
        await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .eq('user_id', du.user_id)
      }

      // ポートフォリオ画像削除
      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id, image_url')
        .eq('user_id', du.user_id)

      for (const p of portfolios || []) {
        if (p.image_url) {
          const key = extractR2Key(p.image_url)
          if (key) {
            await deleteFile(key)
            results.imagesDeleted++
          }
        }
      }
      if (portfolios && portfolios.length > 0) {
        await supabase
          .from('portfolios')
          .delete()
          .eq('user_id', du.user_id)
      }

      // メッセージ添付画像削除
      const { data: messages } = await supabase
        .from('messages')
        .select('id, image_urls')
        .eq('sender_id', du.user_id)
        .not('image_urls', 'is', null)

      for (const msg of messages || []) {
        if (msg.image_urls) {
          for (const url of msg.image_urls) {
            const key = extractR2Key(url)
            if (key) {
              await deleteFile(key)
              results.imagesDeleted++
            }
          }
        }
        await supabase
          .from('messages')
          .update({ image_urls: null })
          .eq('id', msg.id)
      }
    } catch (e) {
      results.errors.push(`image-cleanup ${du.user_id}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // ⑤ 納品ファイルの30日自動削除
  const { data: oldDeliveries } = await supabase
    .from('transactions')
    .select('id, delivery_file_key')
    .not('delivery_file_key', 'is', null)
    .not('delivered_at', 'is', null)
    .lte('delivered_at', thirtyDaysAgo)
    .limit(50)

  for (const tx of oldDeliveries || []) {
    try {
      if (tx.delivery_file_key) {
        await deleteFile(tx.delivery_file_key)
        results.imagesDeleted++
      }
      await supabase
        .from('transactions')
        .update({ delivery_file_url: null, delivery_file_name: null, delivery_file_key: null })
        .eq('id', tx.id)
    } catch (e) {
      results.errors.push(`delivery-cleanup ${tx.id}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // ⑥ メッセージ添付画像の30日自動削除（全ユーザー共通）
  const { data: oldMessages } = await supabase
    .from('messages')
    .select('id, image_urls')
    .not('image_urls', 'is', null)
    .lte('created_at', thirtyDaysAgo)
    .limit(100)

  for (const msg of oldMessages || []) {
    try {
      if (msg.image_urls) {
        for (const url of msg.image_urls) {
          const key = extractR2Key(url)
          if (key) {
            await deleteFile(key)
            results.imagesDeleted++
          }
        }
      }
      await supabase
        .from('messages')
        .update({ image_urls: null })
        .eq('id', msg.id)
    } catch (e) {
      results.errors.push(`msg-cleanup ${msg.id}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // ⑦ 無期限募集の自動停止（募集期限なし＋投稿者が90日以上未ログイン）
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: unlimitedListings } = await supabase
    .from('listings')
    .select('id, client_id')
    .eq('status', '募集中')
    .is('application_deadline', null)

  for (const listing of unlimitedListings || []) {
    try {
      // auth.usersからlast_sign_in_atを取得
      const { data: authUser } = await supabase.auth.admin.getUserById(listing.client_id)
      const lastSignIn = authUser?.user?.last_sign_in_at
      if (!lastSignIn || new Date(lastSignIn) < new Date(ninetyDaysAgo)) {
        await supabase
          .from('listings')
          .update({ status: '募集停止' })
          .eq('id', listing.id)

        createNotification({
          userId: listing.client_id,
          type: 'status_change',
          title: '無期限募集が自動停止されました',
          body: '90日以上ログインがなかったため、募集が自動停止されました。再開するには募集詳細から操作してください。',
          relatedId: listing.id,
        })

        results.listingsExpired++
      }
    } catch (e) {
      results.errors.push(`listing-expire ${listing.id}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  return NextResponse.json(results)
}

// R2公開URLからキーを抽出
function extractR2Key(url: string): string | null {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL
  if (!publicUrl || !url.startsWith(publicUrl)) return null
  return url.slice(publicUrl.length + 1) // +1 for trailing slash
}
