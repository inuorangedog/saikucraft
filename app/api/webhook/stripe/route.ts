import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/app/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { completeBoost } from '@/app/transactions/boost-actions'
import { createNotification } from '@/app/lib/notifications'

// Webhook用にService Role Keyを使う（RLSバイパス）
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getAdminClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent

      if (pi.metadata.type === 'boost') {
        // BOOST決済完了
        await completeBoost({
          transactionId: pi.metadata.transaction_id,
          senderId: pi.metadata.sender_id,
          receiverId: pi.metadata.receiver_id,
          amount: pi.amount,
        })
      } else {
        // 通常の仮払い完了
        const transactionId = pi.metadata.transaction_id
        if (transactionId) {
          // 取引のdeadlineを取得してauto_refund_atを計算
          const { data: tx } = await supabase
            .from('transactions')
            .select('deadline')
            .eq('id', transactionId)
            .single()

          const updateData: Record<string, unknown> = {
            payment_status: 'paid',
            status: 'ラフ提出待ち',
          }

          // 納期がある場合、納期+3日で自動返金日時をセット
          if (tx?.deadline) {
            const refundDate = new Date(tx.deadline + 'T23:59:59')
            refundDate.setDate(refundDate.getDate() + 3)
            updateData.auto_refund_at = refundDate.toISOString()
          }

          await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', transactionId)
        }
      }
      break
    }

    case 'payment_intent.processing': {
      // コンビニ払い・銀行振込で入金待ち状態
      const pi = event.data.object as Stripe.PaymentIntent
      const transactionId = pi.metadata.transaction_id
      if (transactionId && !pi.metadata.type) {
        await supabase
          .from('transactions')
          .update({ payment_status: 'processing' })
          .eq('id', transactionId)

        const { data: tx } = await supabase
          .from('transactions')
          .select('creator_id')
          .eq('id', transactionId)
          .single()

        if (tx) {
          createNotification({
            userId: tx.creator_id,
            type: 'status_change',
            title: '入金待ちの取引があります',
            body: '依頼者がコンビニ払いまたは銀行振込を選択しました。入金確認後に制作が開始されます。',
            relatedId: transactionId,
          })
        }
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      console.error('Payment failed:', pi.id, pi.last_payment_error?.message)

      const transactionId = pi.metadata.transaction_id
      if (transactionId) {
        // 依頼者に決済失敗を通知
        const { data: tx } = await supabase
          .from('transactions')
          .select('client_id')
          .eq('id', transactionId)
          .single()

        if (tx) {
          createNotification({
            userId: tx.client_id,
            type: 'status_change',
            title: '決済に失敗しました',
            body: '別のカードで再度お試しください。',
            relatedId: transactionId,
          })
        }
      }
      break
    }

    case 'payment_intent.canceled': {
      const pi = event.data.object as Stripe.PaymentIntent
      const transactionId = pi.metadata.transaction_id
      if (transactionId) {
        await supabase
          .from('transactions')
          .update({ payment_status: 'canceled' })
          .eq('id', transactionId)
      }
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id

      if (piId) {
        // payment_intent_idから取引を特定
        const { data: tx } = await supabase
          .from('transactions')
          .select('id, client_id, creator_id, payment_status')
          .eq('stripe_payment_intent_id', piId)
          .single()

        if (tx && tx.payment_status !== 'refunded') {
          await supabase
            .from('transactions')
            .update({ payment_status: 'refunded' })
            .eq('id', tx.id)

          createNotification({
            userId: tx.client_id,
            type: 'status_change',
            title: '返金が完了しました',
            body: '返金処理が完了しました。数日以内にお戻しされます。',
            relatedId: tx.id,
          })
        }
      }
      break
    }

    case 'transfer.created': {
      const transfer = event.data.object as Stripe.Transfer
      const transactionId = transfer.metadata?.transaction_id
      if (transactionId) {
        // クリエイターに送金完了通知
        const { data: tx } = await supabase
          .from('transactions')
          .select('creator_id')
          .eq('id', transactionId)
          .single()

        if (tx) {
          createNotification({
            userId: tx.creator_id,
            type: 'status_change',
            title: '報酬が送金されました',
            body: `¥${transfer.amount.toLocaleString()}がStripeアカウントに送金されました。`,
            relatedId: transactionId,
          })
        }
      }
      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      // charges_enabled と payouts_enabled が両方trueならオンボーディング完了
      if (account.charges_enabled && account.payouts_enabled) {
        await supabase
          .from('creator_profiles')
          .update({ stripe_onboarded: true })
          .eq('stripe_account_id', account.id)
      }
      break
    }

    case 'account.application.deauthorized': {
      const app = event.data.object as unknown as { id: string }
      // Connect解除 → 受注停止
      await supabase
        .from('creator_profiles')
        .update({ stripe_onboarded: false, status: '停止中' })
        .eq('stripe_account_id', app.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
