'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TransactionInfo from './transaction-info'
import MessagePanel from './message-panel'
import PaymentForm from './payment-form'
import BoostForm from './boost-form'

type Transaction = {
  id: string
  status: string
  amount: number
  deadline: string | null
  revision_count: number
  max_revisions: number
  delivered_at: string | null
  auto_approve_at: string | null
  wants_copyright_transfer: boolean
  wants_portfolio_ban: boolean
  wants_commercial_use: boolean
  delivery_file_url: string | null
  delivery_file_name: string | null
  created_at: string
  creator_id: string
  client_id: string
  payment_status: string
  stripe_payment_intent_id: string | null
}

type Message = {
  id: string
  sender_id: string
  content: string | null
  image_urls: string[] | null
  created_at: string
}

type Props = {
  transaction: Transaction
  messages: Message[]
  currentUserId: string
  creatorName: string
  clientName: string
  alreadyBoosted: boolean
}

export default function TransactionClient({
  transaction: initialTx,
  messages,
  currentUserId,
  creatorName,
  clientName,
  alreadyBoosted,
}: Props) {
  const router = useRouter()
  const [tx, setTx] = useState(initialTx)
  const isCreator = currentUserId === tx.creator_id
  const isClient = currentUserId === tx.client_id

  const handleStatusChange = (newStatus: string) => {
    setTx((prev) => ({
      ...prev,
      status: newStatus,
      revision_count: newStatus === 'ラフ提出待ち' && prev.status === 'ラフ確認中'
        ? prev.revision_count + 1
        : prev.revision_count,
    }))
    router.refresh()
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4">
      {/* 左側: 取引情報 */}
      <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
        {/* 仮払いフォーム（未払いの依頼者のみ） */}
        {isClient && tx.payment_status === 'unpaid' && (
          <PaymentForm
            transactionId={tx.id}
            amount={tx.amount}
            paymentStatus={tx.payment_status}
          />
        )}
        {/* 入金待ち表示（コンビニ払い・銀行振込） */}
        {tx.payment_status === 'processing' && (
          <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <h3 className="font-medium text-yellow-700 dark:text-yellow-300">入金待ち</h3>
            <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
              コンビニ払いまたは銀行振込の入金を確認中です。入金が確認され次第、制作が開始されます。
            </p>
            <p className="mt-2 text-xs text-yellow-500 dark:text-yellow-500">
              コンビニ払いの場合、期限は3日間です。
            </p>
          </div>
        )}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <TransactionInfo
          transaction={tx}
          isCreator={isCreator}
          isClient={isClient}
          creatorName={creatorName}
          clientName={clientName}
          onStatusChange={handleStatusChange}
        />
        </div>
        {/* BOOST（完了済み取引の依頼者のみ） */}
        {isClient && tx.status === '完了' && (
          <BoostForm
            transactionId={tx.id}
            maxAmount={Math.min(tx.amount * 3, 50000)}
            alreadyBoosted={alreadyBoosted}
          />
        )}
      </div>

      {/* 右側: メッセージ */}
      <div className="flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <MessagePanel
          transactionId={tx.id}
          currentUserId={currentUserId}
          initialMessages={messages}
          creatorName={creatorName}
          clientName={clientName}
          creatorId={tx.creator_id}
          clientId={tx.client_id}
        />
      </div>
    </div>
  )
}
