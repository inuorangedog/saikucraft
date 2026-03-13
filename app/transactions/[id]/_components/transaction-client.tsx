'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase'
import { agreeToTerms } from '../../actions'
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
  detailed_revision_count: number
  max_detailed_revisions: number
  final_revision_count: number
  max_final_revisions: number
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
  creator_agreed: boolean
  client_agreed: boolean
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
  revisionPolicy: string | null
}

export default function TransactionClient({
  transaction: initialTx,
  messages,
  currentUserId,
  creatorName,
  clientName,
  alreadyBoosted,
  revisionPolicy,
}: Props) {
  const router = useRouter()
  const [tx, setTx] = useState(initialTx)
  const [isPending, startTransition] = useTransition()
  const [agreed, setAgreed] = useState(false)
  const isCreator = currentUserId === tx.creator_id
  const isClient = currentUserId === tx.client_id

  const myAgreed = isCreator ? tx.creator_agreed : tx.client_agreed
  const otherAgreed = isCreator ? tx.client_agreed : tx.creator_agreed
  const bothAgreed = tx.creator_agreed && tx.client_agreed
  const needsAgreement = tx.status === '取引開始' && !bothAgreed

  // Realtime で取引の変更を購読
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`transaction:${tx.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${tx.id}`,
        },
        (payload) => {
          const updated = payload.new as typeof tx
          setTx((prev) => ({ ...prev, ...updated }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tx.id])

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

  const handleAgree = () => {
    startTransition(async () => {
      const result = await agreeToTerms(tx.id)
      if ('success' in result) {
        setTx((prev) => ({
          ...prev,
          ...(isCreator ? { creator_agreed: true } : { client_agreed: true }),
        }))
      }
    })
  }

  const hasSpecialConditions = tx.wants_copyright_transfer || tx.wants_portfolio_ban || tx.wants_commercial_use

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* 左側: 取引情報 */}
      <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
        {/* 事前確認ゲート */}
        {needsAgreement && (
          <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
            <h3 className="font-medium text-orange-700 dark:text-orange-300">トラブル防止のために</h3>
            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              取引を開始する前に、以下の内容をご確認ください。両者が確認を完了するまで、チャット・支払い・制作開始はできません。
            </p>

            {!myAgreed ? (
              <div className="mt-3 space-y-3">
                {/* クリエイター向け: 特別条件の警告 */}
                {isCreator && hasSpecialConditions && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">特別条件が含まれています</p>
                    <ul className="mt-1.5 space-y-1 text-xs text-red-600 dark:text-red-400">
                      {tx.wants_copyright_transfer && <li>- 著作権譲渡が求められています</li>}
                      {tx.wants_portfolio_ban && <li>- ポートフォリオへの掲載が禁止されています</li>}
                      {tx.wants_commercial_use && <li>- 商業利用が予定されています</li>}
                    </ul>
                  </div>
                )}

                {/* クリエイター向け: 通常確認 */}
                {isCreator && !hasSpecialConditions && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    取引条件（金額・納期・修正回数）をご確認ください。
                  </p>
                )}

                {/* 依頼者向け: 修正ポリシー */}
                {isClient && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-300">修正の定義について</p>
                    {revisionPolicy ? (
                      <div className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800">
                        <p className="whitespace-pre-wrap text-xs text-zinc-700 dark:text-zinc-300">{revisionPolicy}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        このクリエイターは修正ポリシーを設定していません。修正の範囲についてはメッセージでご確認ください。
                      </p>
                    )}
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ラフ修正 {tx.max_revisions}回 / 詳細ラフ修正 {tx.max_detailed_revisions}回 / 完成品修正 {tx.max_final_revisions}回
                    </p>
                  </div>
                )}

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-orange-400 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                    {isCreator
                      ? '上記の取引条件を確認し、承諾します'
                      : '修正の定義と回数制限を確認しました'}
                  </span>
                </label>

                <button
                  onClick={handleAgree}
                  disabled={!agreed || isPending}
                  className="w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {isPending ? '送信中...' : '確認完了'}
                </button>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">&#10003;</span>
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">確認済み</span>
                </div>
                {!otherAgreed && (
                  <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                    相手方の確認をお待ちください...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 仮払いフォーム（未払いの依頼者のみ、同意後） */}
        {isClient && tx.payment_status === 'unpaid' && bothAgreed && (
          <PaymentForm
            transactionId={tx.id}
            amount={tx.amount}
            paymentStatus={tx.payment_status}
          />
        )}
        {/* 未払い表示（クリエイター側） */}
        {isCreator && tx.payment_status === 'unpaid' && bothAgreed && (
          <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <h3 className="font-medium text-yellow-700 dark:text-yellow-300">仮払い待ち</h3>
            <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
              依頼者の仮払いが完了するまでお待ちください。仮払い完了後に制作を開始できます。
            </p>
          </div>
        )}
        {/* 入金待ち表示（コンビニ払い・銀行振込） */}
        {tx.payment_status === 'processing' && (
          <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <h3 className="font-medium text-yellow-700 dark:text-yellow-300">入金確認中</h3>
            <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
              コンビニ払いまたは銀行振込の入金を確認中です。入金が確認され次第、制作が開始されます。
            </p>
            <p className="mt-2 text-xs text-yellow-500 dark:text-yellow-500">
              コンビニ払いの場合、期限は3日間です。
            </p>
          </div>
        )}
        {/* 仮払い済み表示 */}
        {tx.payment_status === 'paid' && tx.status !== '完了' && (
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">&#10003;</span>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">仮払い済み — ¥{tx.amount.toLocaleString()}</span>
            </div>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              取引完了まで代金はSaikuCraftが安全にお預かりしています
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
          paymentStatus={tx.payment_status}
          revisionPolicy={revisionPolicy}
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
          disabled={needsAgreement}
        />
      </div>
    </div>
  )
}
