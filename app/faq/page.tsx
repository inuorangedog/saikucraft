import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'SaikuCraftに関するよくある質問と回答です。手数料・支払い方法・退会・通報などの疑問にお答えします。',
}

const faqs = [
  {
    category: 'サービスについて',
    items: [
      {
        q: 'SaikuCraftとは何ですか？',
        a: '手描きクリエイターと依頼者を安心して繋ぐ、同人特化のコミッションサービスです。エスクロー決済でトラブルのない取引を実現します。',
      },
      {
        q: '利用料金はかかりますか？',
        a: '登録・閲覧は無料です。取引成立時に手数料7%（Stripe決済手数料込み）をいただきます。',
      },
      {
        q: 'AI生成の作品は出品できますか？',
        a: 'いいえ。SaikuCraftではAI生成物の納品・出品を禁止しています。登録時に「人間が制作した作品のみ出品します」と申告していただきます。違反が発覚した場合、アカウント停止の対象となります。',
      },
    ],
  },
  {
    category: '取引について',
    items: [
      {
        q: 'エスクロー決済とは何ですか？',
        a: '依頼者が支払った代金をSaikuCraftが一時的に預かり、納品が完了した後にクリエイターへ送金する仕組みです。双方にとって安全な取引を保証します。',
      },
      {
        q: 'キャンセルはできますか？',
        a: 'はい。ラフ提出前なら全額返金、ラフ提出後〜詳細ラフ承認前は50%返金、詳細ラフ承認後は返金なしとなります。詳しくはサービス紹介ページをご確認ください。',
      },
      {
        q: '納品後、自動で承認されますか？',
        a: 'はい。納品後3日以内に依頼者が承認しない場合、自動的に承認されクリエイターへ送金されます。',
      },
      {
        q: '修正は何回まで依頼できますか？',
        a: '修正回数の上限はクリエイターが設定します（デフォルト3回）。上限に近づくと「追加料金が発生する可能性があります」と案内が表示されます。',
      },
      {
        q: 'トラブルが起きたらどうすればいいですか？',
        a: '取引画面から「異議申し立て」ボタンで報告できます。3日間の交渉期間の後、運営が証拠ベースで仲裁を行います。',
      },
    ],
  },
  {
    category: 'クリエイター向け',
    items: [
      {
        q: '報酬はどのように受け取れますか？',
        a: 'Stripe Connect Expressを通じて銀行口座に振り込まれます。初回のみStripeへの口座登録が必要です。',
      },
      {
        q: '手数料はいくらですか？',
        a: '取引金額の7%です。これにはStripeの決済手数料（3.6%）が含まれており、追加費用はありません。',
      },
      {
        q: 'BOOSTとは何ですか？',
        a: '取引完了後に依頼者から追加の応援金を受け取れる仕組みです。最低¥500から、取引額の3倍（最大¥50,000）まで受け取れます。直近30日以内にBOOSTされると人気バッジが表示されます。',
      },
      {
        q: '締め切りを過ぎたらどうなりますか？',
        a: '締め切りを3日超過すると自動で全額返金（クリエイター負担）されます。超過が3回でアカウント強制停止となりますのでご注意ください。',
      },
    ],
  },
  {
    category: '依頼者向け',
    items: [
      {
        q: '募集と指名の違いは何ですか？',
        a: '「募集」は条件を公開して複数のクリエイターから応募を受ける方式、「指名」は特定のクリエイターに直接依頼する方式です。',
      },
      {
        q: '著作権はどうなりますか？',
        a: '納品物の著作権はクリエイターに帰属します。依頼者は個人的な使用権を取得します。著作権譲渡・商業利用・ポートフォリオ掲載禁止を希望する場合は、取引開始時に申告してください（追加料金が発生する場合があります）。',
      },
    ],
  },
  {
    category: 'アカウントについて',
    items: [
      {
        q: '年齢制限はありますか？',
        a: '18歳以上の方のみご利用いただけます。登録時に自己申告していただきます。',
      },
      {
        q: '退会できますか？',
        a: '進行中の取引がない場合、退会できます。退会後30日間は画像データを保持し、復旧依頼に対応します。30日後に完全削除されます。',
      },
      {
        q: '確定申告は必要ですか？',
        a: '取引で得た収入は課税対象となる場合があります。詳しくは税理士にご相談ください。SaikuCraftでは税務に関する助言は行っておりません。',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ナビ */}
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold text-orange-500">SaikuCraft</Link>
          <Link href="/login" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
            ログイン
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          よくある質問
        </h1>
        <p className="mt-2 text-center text-zinc-500 dark:text-zinc-400">
          お問い合わせの前にこちらをご確認ください
        </p>

        <div className="mt-12 space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {section.category}
              </h2>
              <div className="mt-4 space-y-4">
                {section.items.map((faq, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                      {faq.q}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            解決しない場合は{' '}
            <a href="mailto:support@saikucraft.com" className="font-medium text-orange-500 hover:text-orange-600">
              support@saikucraft.com
            </a>
            {' '}までお問い合わせください。
          </p>
        </div>
      </div>

      {/* フッター */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
          <p className="text-sm font-medium text-orange-500">SaikuCraft</p>
          <p className="text-xs text-zinc-400">&copy; 2026 SaikuCraft</p>
        </div>
      </footer>
    </div>
  )
}
