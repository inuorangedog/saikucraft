'use server'

import { createClient } from '@/app/lib/supabase-server'
import { stripe } from '@/app/lib/stripe'

// Stripe Connect アカウント作成 + オンボーディングリンク取得
export async function createStripeConnectAccount(): Promise<{ error: string } | { url: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: '認証されていません' }

    // 既存のStripeアカウントを確認
    const { data: cp } = await supabase
      .from('creator_profiles')
      .select('id, stripe_account_id, stripe_onboarded')
      .eq('user_id', user.id)
      .single()

    if (!cp) return { error: 'クリエイタープロフィールが見つかりません' }

    let accountId = cp.stripe_account_id

    // まだアカウントがない場合は作成
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'JP',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      accountId = account.id

      await supabase
        .from('creator_profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', cp.id)
    }

    // オンボーディングリンクを作成
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/stripe`,
      return_url: `${appUrl}/dashboard/stripe?success=true`,
      type: 'account_onboarding',
    })

    return { url: accountLink.url }
  } catch (e) {
    console.error('Stripe Connect error:', e)
    return { error: 'Stripe接続に失敗しました' }
  }
}

// Stripe Connect ダッシュボードリンク取得
export async function getStripeDashboardLink(): Promise<{ error: string } | { url: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: '認証されていません' }

    const { data: cp } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, stripe_onboarded')
      .eq('user_id', user.id)
      .single()

    if (!cp?.stripe_account_id || !cp.stripe_onboarded) {
      return { error: 'Stripeアカウントが設定されていません' }
    }

    const loginLink = await stripe.accounts.createLoginLink(cp.stripe_account_id)
    return { url: loginLink.url }
  } catch (e) {
    console.error('Stripe dashboard link error:', e)
    return { error: 'リンクの取得に失敗しました' }
  }
}
