import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約',
  description: 'SaikuCraftの利用規約です。サービスをご利用いただく前に必ずお読みください。',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold text-orange-500">SaikuCraft</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">利用規約</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">最終更新日: 2026年3月10日</p>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <Section title="第1条（定義）">
            <ul className="list-disc space-y-1 pl-5">
              <li>「本サービス」とは、SaikuCraft（運営者：個人事業主）が提供するコミッションマッチングサービスをいいます。</li>
              <li>「クリエイター」とは、本サービスで制作を受注するユーザーをいいます。</li>
              <li>「依頼者」とは、本サービスで制作を依頼するユーザーをいいます。</li>
              <li>「取引」とは、依頼者とクリエイター間の制作委託契約をいいます。</li>
              <li>「仮払い」とは、取引開始時に依頼者が支払う代金をいいます。</li>
            </ul>
          </Section>

          <Section title="第2条（利用条件）">
            <ul className="list-disc space-y-1 pl-5">
              <li>18歳以上であること（自己申告）</li>
              <li>日本国内に在住していること</li>
              <li>Googleアカウントを保有していること</li>
              <li>本規約に同意したうえで登録すること</li>
            </ul>
          </Section>

          <Section title="第3条（禁止事項）">
            <p>ユーザーは、以下の行為を行ってはなりません。</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>AI生成物の納品・出品</li>
              <li>他者の著作物の無断使用</li>
              <li>未成年者への性的コンテンツの提供</li>
              <li>虚偽のプロフィール・実績の掲載</li>
              <li>サービス外での直接取引（取引成立後の誘導を含む）</li>
              <li>スパム・嫌がらせ行為</li>
              <li>法令に違反する行為</li>
            </ul>
          </Section>

          <Section title="第4条（決済・エスクロー）">
            <ul className="list-disc space-y-1 pl-5">
              <li>依頼者は取引開始時に仮払いを行います。</li>
              <li>仮払いはStripeを通じて行われます。</li>
              <li>依頼者が当社に支払いを完了した時点で、クリエイターへの支払い義務が履行されたものとみなします。</li>
              <li>当社は取引完了後にクリエイターへ代金を送金します。</li>
              <li>送金時に所定の手数料（7%）を控除します。</li>
            </ul>
          </Section>

          <Section title="第5条（キャンセルポリシー）">
            <ul className="list-disc space-y-1 pl-5">
              <li>取引開始〜ラフ提出前：全額返金</li>
              <li>ラフ提出後〜詳細ラフ承認前：50%返金</li>
              <li>詳細ラフ承認後：返金なし</li>
              <li>締め切り3日超過：全額返金（クリエイター負担）</li>
              <li>返金はStripeを通じて行い、数日かかる場合があります。</li>
            </ul>
          </Section>

          <Section title="第6条（著作権）">
            <ul className="list-disc space-y-1 pl-5">
              <li>納品物の著作権はクリエイターに帰属します。</li>
              <li>依頼者は取引完了時に個人的な使用権を取得します。</li>
              <li>著作権の譲渡・ポートフォリオ掲載禁止・商業利用を希望する場合は、取引開始時にシステム上で申告してください。</li>
              <li>上記の特別条件は追加料金が発生する場合があり、クリエイターは条件に同意しない権利を持ちます。</li>
              <li>合意した条件はシステム上に記録されます。</li>
              <li>当社は取引完了後の二次利用に関するトラブルについて一切の責任を負いません。</li>
            </ul>
          </Section>

          <Section title="第7条（R18コンテンツ）">
            <ul className="list-disc space-y-1 pl-5">
              <li>R18コンテンツの取引は18歳以上のユーザー間のみ許可されます。</li>
              <li>ユーザーは登録時に年齢を自己申告するものとし、虚偽申告による損害について当社は責任を負いません。</li>
            </ul>
          </Section>

          <Section title="第8条（AI使用禁止）">
            <ul className="list-disc space-y-1 pl-5">
              <li>クリエイターはAI生成物を納品物として提供することを禁止します。</li>
              <li>AI納品が発覚した場合、取引を即時キャンセルし依頼者に全額返金します（クリエイター負担）。</li>
              <li>繰り返し違反した場合はアカウント停止となります。</li>
              <li>通報が5件に達した場合、PSDデータまたは制作動画の提出を要求する場合があります。</li>
            </ul>
          </Section>

          <Section title="第9条（免責事項）">
            <ul className="list-disc space-y-1 pl-5">
              <li>当社はユーザー間の取引トラブルについて仲裁を行う場合がありますが、最終的な解決を保証しません。</li>
              <li>システム障害・天災等による損害について責任を負いません。</li>
              <li>クリエイターの制作物の品質について保証しません。</li>
              <li>二次創作・著作権に関するトラブルについて責任を負いません。</li>
            </ul>
          </Section>

          <Section title="第10条（アカウント停止・退会）">
            <ul className="list-disc space-y-1 pl-5">
              <li>禁止事項違反・通報5件・締め切り超過3回でアカウントが停止されます。</li>
              <li>進行中の取引がある場合は退会できません。</li>
              <li>退会後のデータはDBに保持しますが、プロフィール・ポートフォリオは非公開となります。</li>
              <li>退会後30日で画像ファイルを削除します。</li>
            </ul>
          </Section>

          <Section title="第11条（規約変更）">
            <ul className="list-disc space-y-1 pl-5">
              <li>重要な変更は30日前にメールで通知します。</li>
              <li>変更後も利用を続けた場合は同意したものとみなします。</li>
            </ul>
          </Section>

          <Section title="第12条（準拠法・管轄）">
            <ul className="list-disc space-y-1 pl-5">
              <li>本規約は日本法に準拠します。</li>
              <li>紛争は東京地方裁判所を第一審の専属管轄とします。</li>
            </ul>
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
