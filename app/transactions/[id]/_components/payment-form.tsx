'use client'

import { useState, useTransition } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createPaymentIntent } from '../../payment-actions'
import { getStripe } from '@/app/lib/stripe-client'

type Props = {
  transactionId: string
  amount: number
  paymentStatus: string
}

export default function PaymentForm({ transactionId, amount, paymentStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [policyAgreed, setPolicyAgreed] = useState(false)

  if (paymentStatus !== 'unpaid') return null

  const handleStartPayment = () => {
    setError('')
    startTransition(async () => {
      const result = await createPaymentIntent(transactionId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setClientSecret(result.clientSecret)
    })
  }

  return (
    <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
      <h3 className="font-medium text-zinc-900 dark:text-zinc-50">仮払い</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        仮払いを完了すると制作が開始されます。取引完了まで代金はSaikuCraftが安全にお預かりします。
      </p>
      <div className="mt-3">
        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          ¥{amount.toLocaleString()}
        </p>
      </div>
      {amount < 500 && (
        <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
          ※ 手数料を考慮するとクリエイターの手取りが非常に少なくなります
        </p>
      )}

      {/* キャンセルポリシー */}
      <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
        <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">キャンセルポリシー</p>
        <ul className="mt-1.5 space-y-0.5 text-xs text-yellow-600 dark:text-yellow-400">
          <li>- 取引開始〜ラフ提出前：全額返金</li>
          <li>- ラフ提出後〜詳細ラフ承認前：50%返金</li>
          <li>- 詳細ラフ承認後：返金なし</li>
          <li>- 締め切り3日超過：全額返金（クリエイター負担）</li>
        </ul>
        <label className="mt-2 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={policyAgreed}
            onChange={(e) => setPolicyAgreed(e.target.checked)}
            className="h-4 w-4 rounded border-yellow-400 text-yellow-500 focus:ring-yellow-500"
          />
          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
            キャンセルポリシーに同意する
          </span>
        </label>
      </div>

      {!clientSecret ? (
        <button
          onClick={handleStartPayment}
          disabled={isPending || !policyAgreed}
          className="mt-3 w-full rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? '準備中...' : '支払い方法を選択する'}
        </button>
      ) : (
        <div className="mt-3">
          <Elements
            stripe={getStripe()}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#f97316',
                  borderRadius: '8px',
                },
              },
              locale: 'ja',
            }}
          >
            <CheckoutForm transactionId={transactionId} />
          </Elements>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

function CheckoutForm({ transactionId }: { transactionId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError('')

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/transactions/${transactionId}?payment=success`,
      },
    })

    // エラーがある場合のみここに到達（成功時はリダイレクト）
    if (stripeError) {
      setError(stripeError.message || '決済に失敗しました')
    }
    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        コンビニ払い・銀行振込の場合、入金確認後に制作が開始されます
      </p>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-3 w-full rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing ? '処理中...' : '仮払いする'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  )
}
