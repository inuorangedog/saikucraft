import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'サービス紹介',
  description: 'SaikuCraftの特徴と使い方をご紹介します。AI不使用ポリシー・エスクロー決済・手数料7%で手描きクリエイターを守ります。',
  openGraph: {
    title: 'SaikuCraftとは',
    description: 'AI不使用ポリシー・エスクロー決済・手数料7%で手描きクリエイターを守るコミッションサービス。',
  },
}

const features = [
  {
    title: 'AI使用禁止ポリシー',
    description: 'すべてのクリエイターが「人間が制作した作品のみ出品」を申告。通報制度とPSD提出義務で手描きの信頼を守ります。',
    icon: '🎨',
  },
  {
    title: 'エスクロー決済で安心',
    description: '依頼者の仮払いをSaikuCraftが預かり、納品完了後にクリエイターへ送金。着手前なら全額返金で双方安心。',
    icon: '🔒',
  },
  {
    title: '手数料7%のみ',
    description: 'Stripe決済手数料を含めて7%。追加費用なし。BOOSTも同じ7%で統一しています。',
    icon: '💰',
  },
  {
    title: '同人イベント連動',
    description: 'コミケ・コミティア・COMIC CITYなどのイベントタグで、締切に合うクリエイターや案件を素早く見つけられます。',
    icon: '📅',
  },
  {
    title: 'BOOSTで応援',
    description: '取引完了後にクリエイターへ追加の応援金を送れます。BOOSTされたクリエイターには人気バッジが表示されます。',
    icon: '🚀',
  },
  {
    title: 'リアルタイムメッセージ',
    description: '取引画面内でLINEのようにリアルタイムでやり取り。進捗ステータスも自動更新で制作状況が一目でわかります。',
    icon: '💬',
  },
]

const steps = [
  {
    role: '依頼者',
    color: 'blue',
    items: [
      'Googleアカウントで無料登録',
      'クリエイターを探す or 募集を投稿',
      '条件が合ったら仮払いで取引開始',
      'ラフ確認 → 修正依頼 → 納品承認',
      '完了！BOOSTで応援も',
    ],
  },
  {
    role: 'クリエイター',
    color: 'orange',
    items: [
      'Googleアカウントで無料登録',
      'プロフィール・料金表・ポートフォリオを設定',
      '募集に応募 or 指名依頼を受ける',
      'ラフ提出 → 制作 → 納品',
      '完了後にStripe経由で報酬受取',
    ],
  },
]

export default function AboutPage() {
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

      {/* ヘッダー */}
      <section className="bg-gradient-to-b from-orange-50 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            手描きクリエイターと
            <br />安心して繋がれる場所
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            SaikuCraftは、AIではなく人の手で作品を届けるクリエイターと
            <br className="hidden sm:block" />
            依頼者のための同人特化コミッションサービスです。
          </p>
        </div>
      </section>

      {/* 特徴 */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">特徴</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-3 font-bold text-zinc-900 dark:text-zinc-50">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使い方 */}
      <section className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">使い方</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {steps.map((s) => (
              <div key={s.role} className={`rounded-lg border p-6 ${
                s.color === 'blue'
                  ? 'border-blue-200 dark:border-blue-800'
                  : 'border-orange-200 dark:border-orange-800'
              }`}>
                <h3 className={`text-lg font-bold ${
                  s.color === 'blue'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {s.role}の場合
                </h3>
                <ol className="mt-4 space-y-3">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        s.color === 'blue' ? 'bg-blue-500' : 'bg-orange-500'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* キャンセルポリシー */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">キャンセルポリシー</h2>
          <div className="mt-8 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">タイミング</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">返金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                <tr>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">取引開始〜ラフ提出前</td>
                  <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">全額返金</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">ラフ提出後〜詳細ラフ承認前</td>
                  <td className="px-4 py-3 font-medium text-yellow-600 dark:text-yellow-400">50%返金</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">詳細ラフ承認後</td>
                  <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400">返金なし</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">締め切り3日超過</td>
                  <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">全額返金（クリエイター負担）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 bg-gradient-to-b from-orange-50 to-zinc-50 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">始めてみませんか？</h2>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">登録は無料。Googleアカウントですぐに始められます。</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-orange-500 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-orange-600"
          >
            無料で始める
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
          <p className="text-sm font-medium text-orange-500">SaikuCraft</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">利用規約</Link>
            <Link href="/privacy" className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">プライバシーポリシー</Link>
            <span className="text-xs text-zinc-400">&copy; 2026 SaikuCraft</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
