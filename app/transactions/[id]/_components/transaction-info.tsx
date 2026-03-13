'use client'

import { useState, useTransition } from 'react'
import { updateTransactionStatus, fileDispute } from '../../actions'
import { cancelTransaction, getCancelInfo } from '../../cancel-actions'
import DeliveryUpload from './delivery-upload'

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
  allow_showcase: boolean
  created_at: string
}

type Props = {
  transaction: Transaction
  isCreator: boolean
  isClient: boolean
  creatorName: string
  clientName: string
  paymentStatus: string
  revisionPolicy: string | null
  onStatusChange: (newStatus: string) => void
}

const STATUS_STEPS = [
  '取引開始',
  'ラフ提出待ち',
  'ラフ確認中',
  '詳細ラフ提出待ち',
  '詳細ラフ確認中',
  '着手済み',
  '完成品制作中',
  '完成品確認中',
  '納品・検収',
  '完了',
]

export default function TransactionInfo({
  transaction: tx,
  isCreator,
  isClient,
  creatorName,
  clientName,
  paymentStatus,
  revisionPolicy,
  onStatusChange,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [cancelInfo, setCancelInfo] = useState<{ refundPercent: number; refundLabel: string; amount: number } | null>(null)
  const [deliveryFile, setDeliveryFile] = useState<{ url: string; fileName: string; key: string } | null>(null)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [allowShowcase, setAllowShowcase] = useState(tx.allow_showcase ?? false)

  const handleAction = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateTransactionStatus(tx.id, newStatus)
      if ('success' in result) {
        onStatusChange(newStatus)
      }
    })
  }

  const handleDispute = () => {
    if (!disputeReason.trim()) return
    startTransition(async () => {
      const result = await fileDispute(tx.id, disputeReason.trim())
      if ('success' in result) {
        setShowDisputeForm(false)
        setDisputeReason('')
        onStatusChange('異議申し立て中')
      }
    })
  }

  const currentStepIndex = STATUS_STEPS.indexOf(tx.status)

  return (
    <div className="space-y-6">
      {/* 取引情報 */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">取引情報</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">クリエイター</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{creatorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">依頼者</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">金額</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">¥{tx.amount.toLocaleString()}</span>
          </div>
          {tx.deadline && (
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">納期</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{tx.deadline}</span>
            </div>
          )}
        </div>
      </div>

      {/* 修正ポリシー */}
      {revisionPolicy && (
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">修正ポリシー</p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-700 dark:text-zinc-300">{revisionPolicy}</p>
        </div>
      )}

      {/* 特別条件 */}
      {(tx.wants_copyright_transfer || tx.wants_portfolio_ban || tx.wants_commercial_use) && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">特別条件</p>
          <div className="mt-1 space-y-1 text-xs text-yellow-600 dark:text-yellow-400">
            {tx.wants_copyright_transfer && <p>- 著作権譲渡を希望</p>}
            {tx.wants_portfolio_ban && <p>- ポートフォリオ掲載禁止を希望</p>}
            {tx.wants_commercial_use && <p>- 商業利用を希望</p>}
          </div>
        </div>
      )}

      {/* 進捗ステータス */}
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">進捗</h3>
        <div className="mt-3 space-y-2">
          {STATUS_STEPS.map((step, i) => {
            const isCurrent = step === tx.status
            const isDone = i < currentStepIndex
            return (
              <div key={step} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isCurrent
                    ? 'bg-orange-500 text-white'
                    : isDone
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-700'
                }`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${
                  isCurrent
                    ? 'font-medium text-orange-600 dark:text-orange-400'
                    : isDone
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-zinc-400 dark:text-zinc-500'
                }`}>
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 修正回数 */}
      <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
        <div className="space-y-2">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">ラフ修正</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {tx.revision_count} / {tx.max_revisions}回
            </p>
            {tx.revision_count >= tx.max_revisions && (
              <p className="mt-0.5 text-xs text-red-500">上限に達しています</p>
            )}
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">詳細ラフ修正</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {tx.detailed_revision_count} / {tx.max_detailed_revisions}回
            </p>
            {tx.detailed_revision_count >= tx.max_detailed_revisions && (
              <p className="mt-0.5 text-xs text-red-500">上限に達しています</p>
            )}
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">完成品修正</p>
            <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {tx.final_revision_count} / {tx.max_final_revisions}回
            </p>
            {tx.final_revision_count >= tx.max_final_revisions && (
              <p className="mt-0.5 text-xs text-red-500">上限に達しています</p>
            )}
          </div>
        </div>
        {isCreator && tx.status !== '完了' && tx.status !== '納品・検収' && (() => {
          const overLimits: { type: 'rough' | 'detailed' | 'final'; label: string }[] = []
          if (tx.revision_count >= tx.max_revisions) overLimits.push({ type: 'rough', label: 'ラフ' })
          if (tx.detailed_revision_count >= tx.max_detailed_revisions) overLimits.push({ type: 'detailed', label: '詳細ラフ' })
          if (tx.final_revision_count >= tx.max_final_revisions) overLimits.push({ type: 'final', label: '完成品' })
          return overLimits.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                if (!confirm(`${item.label}の追加修正を1回許可しますか？`)) return
                startTransition(async () => {
                  const { allowExtraRevision } = await import('../../actions')
                  await allowExtraRevision(tx.id, item.type)
                })
              }}
              disabled={isPending}
              className="mt-1 w-full rounded-lg border border-orange-300 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
            >
              {item.label}の追加修正を許可（+1回）
            </button>
          ))
        })()}
      </div>

      {/* アクションボタン */}
      {tx.status !== '完了' && tx.status !== '異議申し立て中' && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">アクション</h3>

          {/* クリエイターのアクション */}
          {isCreator && (
            <>
              {tx.status === '取引開始' && (
                paymentStatus === 'paid' ? (
                  <button onClick={() => handleAction('ラフ提出待ち')} disabled={isPending}
                    className="w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300">
                    制作を開始する
                  </button>
                ) : (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">仮払い待ち</p>
                    <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                      依頼者の仮払いが完了するまで制作を開始できません。メッセージでやりとりは可能です。
                    </p>
                  </div>
                )
              )}
              {tx.status === 'ラフ提出待ち' && (
                <button onClick={() => handleAction('ラフ確認中')} disabled={isPending}
                  className="w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300">
                  ラフを提出する
                </button>
              )}
              {tx.status === '詳細ラフ提出待ち' && (
                <button onClick={() => handleAction('詳細ラフ確認中')} disabled={isPending}
                  className="w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300">
                  詳細ラフを提出する
                </button>
              )}
              {tx.status === '着手済み' && (
                <button onClick={() => handleAction('完成品制作中')} disabled={isPending}
                  className="w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300">
                  完成品の準備に入る
                </button>
              )}
              {tx.status === '完成品制作中' && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">メッセージで完成品のプレビューを送ってから提出してください</p>
                  <button onClick={() => handleAction('完成品確認中')} disabled={isPending}
                    className="w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300">
                    完成品を提出する
                  </button>
                </div>
              )}
              {tx.status === '納品・検収' && !tx.delivery_file_url && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">最終納品ファイルをアップロードできます</p>
                  <DeliveryUpload
                    transactionId={tx.id}
                    onUploaded={(data) => setDeliveryFile(data)}
                  />
                  {deliveryFile && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-950">
                      <p className="truncate text-xs text-green-700 dark:text-green-300">
                        {deliveryFile.fileName} （アップロード済み）
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-zinc-400">
                    大容量ファイルはギガファイル便等の外部サービスもご利用いただけます
                  </p>
                </div>
              )}
            </>
          )}

          {/* 依頼者のアクション */}
          {isClient && (
            <>
              {tx.status === 'ラフ確認中' && (
                <div className="space-y-2">
                  <button onClick={() => handleAction('詳細ラフ提出待ち')} disabled={isPending}
                    className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-zinc-300">
                    ラフを承認する
                  </button>
                  {tx.revision_count < tx.max_revisions && (
                    <button onClick={() => handleAction('ラフ提出待ち')} disabled={isPending}
                      className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300">
                      修正を依頼する（{tx.revision_count}/{tx.max_revisions}）
                    </button>
                  )}
                </div>
              )}
              {tx.status === '詳細ラフ確認中' && (
                <div className="space-y-2">
                  <button onClick={() => handleAction('着手済み')} disabled={isPending}
                    className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-zinc-300">
                    詳細ラフを承認する（着手開始）
                  </button>
                  {tx.detailed_revision_count < tx.max_detailed_revisions && (
                    <button onClick={() => handleAction('詳細ラフ提出待ち')} disabled={isPending}
                      className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300">
                      修正を依頼する（{tx.detailed_revision_count}/{tx.max_detailed_revisions}）
                    </button>
                  )}
                </div>
              )}
              {tx.status === '完成品確認中' && (
                <div className="space-y-2">
                  <button onClick={() => handleAction('納品・検収')} disabled={isPending}
                    className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-zinc-300">
                    完成品を承認する（納品へ）
                  </button>
                  {tx.final_revision_count < tx.max_final_revisions && (
                    <button onClick={() => handleAction('完成品制作中')} disabled={isPending}
                      className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300">
                      修正を依頼する（{tx.final_revision_count}/{tx.max_final_revisions}）
                    </button>
                  )}
                </div>
              )}
              {tx.status === '納品・検収' && (
                <div className="space-y-3">
                  <label className="flex items-start gap-2 cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                    <input
                      type="checkbox"
                      checked={allowShowcase}
                      onChange={(e) => setAllowShowcase(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        作品のSNS宣伝・ショーケース掲載を許可する
                      </span>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        許可すると、クリエイターが作品の一部をSaikuCraftのショーケースやSNSに掲載できます。
                      </p>
                    </div>
                  </label>
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        const result = await updateTransactionStatus(tx.id, '完了', undefined, allowShowcase)
                        if ('success' in result) {
                          onStatusChange('完了')
                        }
                      })
                    }}
                    disabled={isPending}
                    className="w-full rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:bg-zinc-300"
                  >
                    納品を承認する
                  </button>
                </div>
              )}
              {/* キャンセルボタン */}
              {!cancelInfo ? (
                <button
                  onClick={() => {
                    startTransition(async () => {
                      const info = await getCancelInfo(tx.id)
                      if ('refundPercent' in info) setCancelInfo(info)
                    })
                  }}
                  disabled={isPending}
                  className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400"
                >
                  キャンセルする
                </button>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">キャンセル確認</p>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    現在のステータスでは「{cancelInfo.refundLabel}」となります。
                    {cancelInfo.refundPercent > 0 && (
                      <>（返金額: ¥{Math.floor(cancelInfo.amount * cancelInfo.refundPercent / 100).toLocaleString()}）</>
                    )}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setCancelInfo(null)}
                      className="flex-1 rounded-lg border border-zinc-300 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
                    >
                      戻る
                    </button>
                    <button
                      onClick={() => {
                        startTransition(async () => {
                          const result = await cancelTransaction(tx.id)
                          if ('success' in result) {
                            onStatusChange('完了')
                          }
                        })
                      }}
                      disabled={isPending}
                      className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:bg-zinc-300"
                    >
                      {isPending ? '処理中...' : 'キャンセルを実行'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 異議申し立て（両者共通） */}
      {tx.status !== '完了' && tx.status !== '異議申し立て中' && tx.status !== '取引開始' && (
        <div>
          {!showDisputeForm ? (
            <button
              onClick={() => setShowDisputeForm(true)}
              className="text-xs text-zinc-400 underline hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
            >
              問題がある場合は異議申し立て
            </button>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">異議申し立て</p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                管理者が内容を確認し対応します。取引は一時停止されます。
              </p>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="異議の内容を具体的に記入してください"
                rows={3}
                className="mt-2 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm dark:border-red-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => { setShowDisputeForm(false); setDisputeReason('') }}
                  className="flex-1 rounded-lg border border-zinc-300 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDispute}
                  disabled={isPending || !disputeReason.trim()}
                  className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {isPending ? '送信中...' : '異議を送信'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 納品ファイル */}
      {tx.delivery_file_url && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">納品ファイル</p>
          <a
            href={tx.delivery_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {tx.delivery_file_name || 'ダウンロード'}
          </a>
          <p className="mt-1 text-xs text-zinc-400">30日後に自動削除されます</p>
        </div>
      )}

      {/* ショーケース投稿案内（クリエイター向け・完了＆許可済み） */}
      {isCreator && tx.status === '完了' && tx.allow_showcase && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
          <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
            ショーケースに投稿できます
          </p>
          <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
            依頼者が宣伝を許可しました。作品の切り抜きやプレビューをショーケースに投稿して、あなたの実績をアピールしましょう。
          </p>
          <a
            href={`/showcase/new?tx=${tx.id}`}
            className="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            ショーケースに投稿する
          </a>
        </div>
      )}

      {/* 異議申し立て中の表示 */}
      {tx.status === '異議申し立て中' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">異議申し立て中</p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            管理者が確認中です。メッセージで状況を共有してください。
          </p>
        </div>
      )}

      {/* 自動承認情報 */}
      {tx.status === '納品・検収' && tx.auto_approve_at && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
          <p className="text-xs text-green-700 dark:text-green-300">
            {new Date(tx.auto_approve_at).toLocaleDateString('ja-JP')} に自動承認されます
          </p>
        </div>
      )}
    </div>
  )
}
