'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendNegotiationMessage, updateNegotiationStatus } from '../../actions'

type Negotiation = {
  id: string
  creator_id: string
  client_id: string
  title: string
  description: string | null
  budget: number | null
  deadline: string | null
  status: string
  created_at: string
}

type Message = {
  id: string
  sender_id: string
  message: string
  proposed_budget: number | null
  proposed_deadline: string | null
  created_at: string
}

type Props = {
  negotiation: Negotiation
  messages: Message[]
  currentUserId: string
  creatorName: string
  clientName: string
}

export default function NegotiationClient({
  negotiation: initialNeg,
  messages: initialMessages,
  currentUserId,
  creatorName,
  clientName,
}: Props) {
  const router = useRouter()
  const [neg, setNeg] = useState(initialNeg)
  const [messages, setMessages] = useState(initialMessages)
  const [isPending, startTransition] = useTransition()
  const [newMessage, setNewMessage] = useState('')
  const [proposedBudget, setProposedBudget] = useState('')
  const [proposedDeadline, setProposedDeadline] = useState('')
  const [showProposal, setShowProposal] = useState(false)

  const isCreator = currentUserId === neg.creator_id
  const isClient = currentUserId === neg.client_id
  const isActive = neg.status === '交渉中'

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    startTransition(async () => {
      const result = await sendNegotiationMessage(neg.id, {
        message: newMessage.trim(),
        proposedBudget: proposedBudget ? parseInt(proposedBudget) : null,
        proposedDeadline: proposedDeadline || null,
      })
      if ('success' in result) {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          sender_id: currentUserId,
          message: newMessage.trim(),
          proposed_budget: proposedBudget ? parseInt(proposedBudget) : null,
          proposed_deadline: proposedDeadline || null,
          created_at: new Date().toISOString(),
        }])
        setNewMessage('')
        setProposedBudget('')
        setProposedDeadline('')
        setShowProposal(false)
      }
    })
  }

  const handleStatusChange = (newStatus: '合意済み' | '辞退' | 'キャンセル') => {
    const confirmMessages: Record<string, string> = {
      '合意済み': 'この条件で合意しますか？取引が作成されます。',
      '辞退': 'この依頼を辞退しますか？',
      'キャンセル': 'この依頼をキャンセルしますか？',
    }
    if (!confirm(confirmMessages[newStatus])) return

    startTransition(async () => {
      const result = await updateNegotiationStatus(neg.id, newStatus)
      if ('success' in result) {
        setNeg((prev) => ({ ...prev, status: newStatus }))
        if (result.transactionId) {
          router.push(`/transactions/${result.transactionId}`)
        }
      }
    })
  }

  // 最新の提案を取得
  const lastProposal = [...messages].reverse().find((m) => m.proposed_budget || m.proposed_deadline)
  const currentBudget = lastProposal?.proposed_budget || neg.budget
  const currentDeadline = lastProposal?.proposed_deadline || neg.deadline

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{neg.title}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {creatorName}（クリエイター） × {clientName}（依頼者）
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${
          neg.status === '交渉中' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : neg.status === '合意済み' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
        }`}>
          {neg.status}
        </span>
      </div>

      {/* 現在の条件 */}
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">現在の条件</h2>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">予算</span>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {currentBudget ? `¥${currentBudget.toLocaleString()}` : '未定'}
            </p>
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">納期</span>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {currentDeadline || '未定'}
            </p>
          </div>
        </div>
        {neg.description && (
          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">依頼内容</span>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {neg.description}
            </p>
          </div>
        )}
      </div>

      {/* メッセージ一覧 */}
      <div className="mt-6 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          const senderName = msg.sender_id === neg.creator_id ? creatorName : clientName
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg p-3 ${
                isMine
                  ? 'bg-orange-500 text-white'
                  : 'border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
              }`}>
                <p className={`text-xs ${isMine ? 'text-orange-100' : 'text-zinc-400'}`}>
                  {senderName}
                </p>
                {(msg.proposed_budget || msg.proposed_deadline) && (
                  <div className={`mt-1 rounded p-2 text-xs ${
                    isMine ? 'bg-orange-600' : 'bg-zinc-50 dark:bg-zinc-800'
                  }`}>
                    {msg.proposed_budget && (
                      <p>提案予算: ¥{msg.proposed_budget.toLocaleString()}</p>
                    )}
                    {msg.proposed_deadline && (
                      <p>提案納期: {msg.proposed_deadline}</p>
                    )}
                  </div>
                )}
                <p className={`mt-1 text-sm whitespace-pre-wrap ${
                  isMine ? '' : 'text-zinc-700 dark:text-zinc-300'
                }`}>
                  {msg.message}
                </p>
                <p className={`mt-1 text-[10px] ${isMine ? 'text-orange-200' : 'text-zinc-400'}`}>
                  {new Date(msg.created_at).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 入力・アクション */}
      {isActive && (
        <div className="mt-6 space-y-3">
          {/* 条件変更トグル */}
          <button
            onClick={() => setShowProposal(!showProposal)}
            className="text-sm text-orange-500 hover:text-orange-600"
          >
            {showProposal ? '条件変更を閉じる' : '条件変更を提案する'}
          </button>

          {showProposal && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400">提案予算</label>
                <input
                  type="number"
                  value={proposedBudget}
                  onChange={(e) => setProposedBudget(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="¥"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400">提案納期</label>
                <input
                  type="date"
                  value={proposedDeadline}
                  onChange={(e) => setProposedDeadline(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* メッセージ入力 */}
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={2}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="メッセージを入力..."
            />
            <button
              onClick={handleSendMessage}
              disabled={isPending || !newMessage.trim()}
              className="shrink-0 rounded-lg bg-orange-500 px-4 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              送信
            </button>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            {isCreator && (
              <>
                <button
                  onClick={() => handleStatusChange('合意済み')}
                  disabled={isPending || !currentBudget}
                  className="flex-1 rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                >
                  承諾する
                </button>
                <button
                  onClick={() => handleStatusChange('辞退')}
                  disabled={isPending}
                  className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300"
                >
                  辞退する
                </button>
              </>
            )}
            {isClient && (
              <>
                <button
                  onClick={() => handleStatusChange('合意済み')}
                  disabled={isPending || !currentBudget}
                  className="flex-1 rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                >
                  合意する
                </button>
                <button
                  onClick={() => handleStatusChange('キャンセル')}
                  disabled={isPending}
                  className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300"
                >
                  キャンセル
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 合意済みの場合 */}
      {neg.status === '合意済み' && isClient && (
        <div className="mt-6 rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            合意が成立しました。取引画面から仮払いを行ってください。
          </p>
        </div>
      )}
    </div>
  )
}
