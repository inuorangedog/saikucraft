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
  delivered_at: string | null
  auto_approve_at: string | null
  wants_copyright_transfer: boolean
  wants_portfolio_ban: boolean
  wants_commercial_use: boolean
  delivery_file_url: string | null
  delivery_file_name: string | null
  created_at: string
}

type Props = {
  transaction: Transaction
  isCreator: boolean
  isClient: boolean
  creatorName: string
  clientName: string
  onStatusChange: (newStatus: string) => void
}

const STATUS_STEPS = [
  '取引開始',
  'ラフ提出待ち',
  'ラフ確認中',
  '詳細ラフ確認中',
  '着手済み',
  '納品済み',
  '完了',
]

export default function TransactionInfo({
  transaction: tx,
  isCreator,
  isClient,
  creatorName,
  clientName,
  onStatusChange,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [cancelInfo, setCancelInfo] = useState<{ refundPercent: number; refundLabel: string; amount: number } | null>(null)
  const [deliveryFile, setDeliveryFile] = useState<{ url: string; fileName: string; key: string } | null>(null)

  const handleAction = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateTransactionStatus(tx.id, newStatus)
      if ('success' in result) {
        onStatusChange(newStatus)
      }
    })
  }

  const handleDispute = () => {
    startTransition(async () => {
      const result = await fileDispute(tx.id)
      if ('success' in result) {
        onStatusChange('異議申し立て中')
      }
    })
  }

  const currentStepIndex = STATUS_STEPS.indexOf(tx.status)
  const revisionWarning = tx.revision_count >= tx.max_revisions - 1 && tx.revision_count < tx.max_revisions

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
        <p className="text-xs text-zinc-500 dark:text-zinc-400">ラフ修正</p>
        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {tx.revision_count} / {tx.max_revisions}回
        </p>
        {revisionWarning && (
          <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
            追加料金が発生する可能性があります
          </p>
        )}
        {tx.revision_count >= tx.max_revisions && (
          <p className="mt-1 text-xs text-red-500">修正上限に達しています</p>
        )}
      </div>

      {/* アクションボタン */}
      {tx.status !== '完了' && tx.status !== '異議申し立て中' && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">アクション</h3>

          {/* クリエイターのアクション */}
          {isCreator && (
            <>
              {tx.status === '取引開始' && (
                <button onClick={() => handleAction('ラフ提出待ち')} disabled={isPending}
                  className="w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300">
                  制作を開始する
                </button>
              )}
              {tx.status === 'ラフ提出待ち' && (
                <button onClick={() => handleAction('ラフ確認中')} disabled={isPending}
                  className="w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300">
                  ラフを提出する
                </button>
              )}
              {tx.status === '着手済み' && (
                <div className="space-y-2">
                  <DeliveryUpload
                    transactionId={tx.id}
                    onUploaded={(data) => setDeliveryFile(data)}
                  />
                  {deliveryFile && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-950">
                      <p className="truncate text-xs text-green-700 dark:text-green-300">
                        {deliveryFile.fileName}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        const result = await updateTransactionStatus(tx.id, '納品済み', deliveryFile || undefined)
                        if ('success' in result) {
                          onStatusChange('納品済み')
                        }
                      })
                    }}
                    disabled={isPending}
                    className="w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-zinc-300"
                  >
                    {deliveryFile ? '納品する（ファイル付き）' : '納品する（ファイルなし）'}
                  </button>
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
                  <button onClick={() => handleAction('詳細ラフ確認中')} disabled={isPending}
                    className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-zinc-300">
                    ラフを承認する
                  </button>
                  {tx.revision_count < tx.max_revisions && (
                    <button onClick={() => handleAction('ラフ提出待ち')} disabled={isPending}
                      className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300">
                      修正を依頼する
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
                  <button onClick={() => handleAction('ラフ確認中')} disabled={isPending}
                    className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300">
                    修正を依頼する
                  </button>
                </div>
              )}
              {tx.status === '納品済み' && (
                <button onClick={() => handleAction('完了')} disabled={isPending}
                  className="w-full rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:bg-zinc-300">
                  納品を承認する
                </button>
              )}
              <button onClick={handleDispute} disabled={isPending}
                className="w-full rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400">
                異議申し立て
              </button>

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

      {/* 納品ファイル */}
      {tx.delivery_file_url && (tx.status === '納品済み' || tx.status === '完了') && (
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
      {tx.status === '納品済み' && tx.auto_approve_at && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
          <p className="text-xs text-green-700 dark:text-green-300">
            {new Date(tx.auto_approve_at).toLocaleDateString('ja-JP')} に自動承認されます
          </p>
        </div>
      )}
    </div>
  )
}
