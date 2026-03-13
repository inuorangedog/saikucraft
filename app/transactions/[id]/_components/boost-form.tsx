'use client'

import { useState, useTransition } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { sendBoost } from '../../boost-actions'
import { getStripe } from '@/app/lib/stripe-client'

type Props = {
  transactionId: string
  maxAmount: number
  alreadyBoosted: boolean
}

const PRESETS = [500, 1000, 3000, 5000, 10000]

export default function BoostForm({ transactionId, maxAmount, alreadyBoosted }: Props) {
  const [amount, setAmount] = useState(500)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [boosted, setBoosted] = useState(alreadyBoosted)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  if (boosted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
        <p className="text-sm font-medium text-green-700 dark:text-green-300">
          BOOSTを送信しました！ありがとうございます
        </p>
      </div>
    )
  }

  const availablePresets = PRESETS.filter((p) => p <= maxAmount)

  const handleStartBoost = () => {
    setError('')
    startTransition(async () => {
      const result = await sendBoost(transactionId, amount, message || undefined)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setClientSecret(result.clientSecret)
    })
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
      <h3 className="font-medium text-zinc-900 dark:text-zinc-50">BOOST</h3>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        クリエイターに感謝のチップを送りましょう（手数料7%）
      </p>

      {!clientSecret ? (
        <>
          {/* プリセット金額 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {availablePresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  amount === preset
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-zinc-700 hover:bg-orange-100 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                ¥{preset.toLocaleString()}
              </button>
            ))}
          </div>

          {/* カスタム金額 */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-zinc-500">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              min={500}
              max={maxAmount}
              step={100}
              className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <span className="text-xs text-zinc-400">上限 ¥{maxAmount.toLocaleString()}</span>
          </div>

          {/* お礼メッセージ */}
          <div className="mt-3">
            <label className="text-xs text-zinc-600 dark:text-zinc-400">
              お礼メッセージ（任意）
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="素敵な作品をありがとうございました！"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <button
            onClick={handleStartBoost}
            disabled={isPending || amount < 500 || amount > maxAmount || amount % 100 !== 0}
            className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isPending ? '準備中...' : `¥${amount.toLocaleString()} BOOSTする`}
          </button>
        </>
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
            <BoostCheckoutForm transactionId={transactionId} />
          </Elements>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

function BoostCheckoutForm({ transactionId }: { transactionId: string }) {
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
        return_url: `${window.location.origin}/transactions/${transactionId}?boosted=true`,
      },
    })

    if (stripeError) {
      setError(stripeError.message || '決済に失敗しました')
    }
    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-3 w-full rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing ? '処理中...' : 'BOOSTを送る'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  )
}
