import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: 'SaikuCraftのプライバシーポリシーです。個人情報の取り扱いについてご確認ください。',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold text-orange-500">SaikuCraft</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">プライバシーポリシー</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">最終更新日: 2026年3月10日</p>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <Section title="1. 収集する情報">
            <p>当社は以下の情報を収集します。</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>アカウント情報</strong>: Googleアカウント経由で取得するメールアドレス、表示名</li>
              <li><strong>プロフィール情報</strong>: ユーザー名、アバター画像、自己紹介文、外部リンク（任意で設定）</li>
              <li><strong>取引情報</strong>: 取引内容、金額、メッセージ、納品ファイル</li>
              <li><strong>利用情報</strong>: アクセスログ、利用状況</li>
            </ul>
            <p className="mt-2">決済に関する金融情報（クレジットカード番号、銀行口座情報）はStripe, Inc.が管理しており、当社のサーバーには保存されません。</p>
          </Section>

          <Section title="2. 情報の利用目的">
            <ul className="list-disc space-y-1 pl-5">
              <li>サービスの提供・運営・改善</li>
              <li>取引の仲介・エスクロー決済の処理</li>
              <li>通知メールの送信（取引進捗、メッセージ、お気に入り更新等）</li>
              <li>不正利用の防止・通報対応</li>
              <li>利用規約違反の調査</li>
              <li>ユーザーサポート</li>
            </ul>
          </Section>

          <Section title="3. 情報の第三者提供">
            <p>当社は以下の場合を除き、個人情報を第三者に提供しません。</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>決済処理のためStripe, Inc.に提供する場合</li>
              <li>メール送信のためResend（メール配信サービス）に提供する場合</li>
            </ul>
          </Section>

          <Section title="4. 情報の保管">
            <ul className="list-disc space-y-1 pl-5">
              <li>アカウント情報・取引履歴: アカウント有効期間中および退会後も保管します</li>
              <li>メッセージ添付画像: 送信から30日後に自動削除します</li>
              <li>納品ファイル: 納品から30日後に自動削除します</li>
              <li>退会後の画像ファイル: 退会から30日後に自動削除します</li>
            </ul>
          </Section>

          <Section title="5. 外部サービス">
            <p>当社は以下の外部サービスを利用しています。各サービスのプライバシーポリシーもご確認ください。</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Supabase</strong>: データベース・認証（Google OAuth）</li>
              <li><strong>Stripe</strong>: 決済処理・送金</li>
              <li><strong>Cloudflare R2</strong>: 画像・ファイルストレージ</li>
              <li><strong>Resend</strong>: メール通知配信</li>
              <li><strong>Vercel</strong>: ホスティング・CDN</li>
            </ul>
          </Section>

          <Section title="6. Cookieの使用">
            <p>当社はサービスの提供に必要なCookie（認証セッション等）を使用します。ブラウザの設定でCookieを無効にすることができますが、サービスの一部が利用できなくなる場合があります。</p>
          </Section>

          <Section title="7. ユーザーの権利">
            <p>ユーザーは以下の権利を有します。</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>プロフィール情報の閲覧・編集・削除（ダッシュボードから）</li>
              <li>アカウントの退会（進行中の取引がない場合）</li>
              <li>通知メールの受信設定の変更</li>
              <li>個人情報の開示・訂正・削除の請求（support@saikucraft.com まで）</li>
            </ul>
          </Section>

          <Section title="8. 安全管理措置">
            <ul className="list-disc space-y-1 pl-5">
              <li>通信はSSL/TLSで暗号化されています</li>
              <li>データベースへのアクセスは行レベルセキュリティ（RLS）で制御されています</li>
              <li>金融情報はStripeが PCI DSS準拠の環境で管理しています</li>
            </ul>
          </Section>

          <Section title="9. 未成年者について">
            <p>本サービスは18歳以上のユーザーを対象としています。18歳未満の方は利用できません。</p>
          </Section>

          <Section title="10. ポリシーの変更">
            <p>本ポリシーを変更する場合は、サイト上での告知またはメールにて通知します。</p>
          </Section>

          <Section title="11. お問い合わせ">
            <p>個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。</p>
            <p className="mt-2 font-medium">support@saikucraft.com</p>
          </Section>
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-700">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
            &larr; トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
