import Link from 'next/link'

export const metadata = {
  title: 'プレミアム会員',
  description: 'ザツガク王国プレミアム会員で全記事読み放題・広告なし・限定コンテンツが楽しめます。月額¥480から。',
}

const plans = [
  {
    name: 'フリー',
    price: '¥0',
    period: 'ずっと無料',
    color: 'bg-gray-50 border-gray-200',
    buttonColor: 'bg-gray-200 text-gray-600',
    buttonText: '現在のプラン',
    features: [
      { label: '無料記事を読む', ok: true },
      { label: '広告あり', ok: false },
      { label: 'プレミアム記事', ok: false },
      { label: '限定コンテンツ', ok: false },
      { label: 'メールサポート', ok: false },
    ],
  },
  {
    name: 'スタンダード',
    price: '¥480',
    period: '/ 月',
    color: 'bg-orange-50 border-orange-300 ring-2 ring-orange-400',
    buttonColor: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90',
    buttonText: '今すぐ始める',
    badge: '人気No.1',
    features: [
      { label: '全記事読み放題', ok: true },
      { label: '広告なしで快適閲覧', ok: true },
      { label: 'プレミアム記事', ok: true },
      { label: '限定コンテンツ', ok: false },
      { label: 'メールサポート', ok: false },
    ],
  },
  {
    name: 'プレミアム',
    price: '¥980',
    period: '/ 月',
    color: 'bg-yellow-50 border-yellow-300',
    buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:opacity-90',
    buttonText: '今すぐ始める',
    features: [
      { label: '全記事読み放題', ok: true },
      { label: '広告なしで快適閲覧', ok: true },
      { label: 'プレミアム記事', ok: true },
      { label: '月2回の限定コンテンツ配信', ok: true },
      { label: 'メールサポート優先対応', ok: true },
    ],
  },
]

const testimonials = [
  { name: 'Aさん（30代・会社員）', text: '毎日通勤中に読んでいます。話のネタが増えて職場でも役立っています！' },
  { name: 'Bさん（20代・学生）', text: '雑学を読んでいるうちに自然と理科・社会の知識が深まりました。', },
  { name: 'Cさん（40代・主婦）', text: '子供に「なんで？」と聞かれたときに答えられるようになりました。' },
]

export default function PremiumPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="text-6xl mb-4">👑</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            プレミアム会員
          </span>で<br />もっと深く楽しもう
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          月額¥480から。全記事読み放題・広告なし・限定コンテンツ。いつでもキャンセル可能です。
        </p>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {plans.map(plan => (
          <div key={plan.name} className={`rounded-2xl border p-8 relative ${plan.color}`}>
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                {plan.badge}
              </span>
            )}
            <h2 className="text-xl font-bold text-gray-800 mb-1">{plan.name}</h2>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-bold text-gray-800">{plan.price}</span>
              <span className="text-gray-500 mb-1">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map(f => (
                <li key={f.label} className="flex items-center gap-3 text-sm">
                  <span className={f.ok ? 'text-green-500' : 'text-gray-300'}>{f.ok ? '✓' : '✗'}</span>
                  <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
                </li>
              ))}
            </ul>
            <button className={`w-full py-3 rounded-full font-bold transition-opacity ${plan.buttonColor}`}>
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">よくある質問</h2>
        <div className="space-y-4">
          {[
            { q: 'いつでも解約できますか？', a: 'はい、いつでもキャンセル可能です。解約後も月末まで利用できます。' },
            { q: '支払い方法は？', a: 'クレジットカード（Visa / Mastercard / JCB）に対応しています。' },
            { q: '無料会員との違いは？', a: '無料会員は一部の記事のみ閲覧可能です。プレミアム会員は全記事を広告なしでお読みいただけます。' },
            { q: '年払いはありますか？', a: '年払いプランをご利用いただくと2ヶ月分お得になります。詳しくはお問い合わせください。' },
          ].map(item => (
            <div key={item.q} className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-2">Q. {item.q}</h3>
              <p className="text-gray-600 text-sm">A. {item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">会員の声</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400">★</span>)}
              </div>
              <p className="text-gray-600 text-sm mb-4">「{t.text}」</p>
              <p className="text-xs text-gray-400 font-medium">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 text-white rounded-3xl p-10 text-center">
        <h2 className="text-3xl font-bold mb-3">今すぐ始めよう</h2>
        <p className="text-orange-100 mb-6">最初の1ヶ月は無料でお試しいただけます</p>
        <button className="bg-white text-orange-500 font-bold px-10 py-4 rounded-full hover:bg-orange-50 transition-colors text-lg">
          無料でお試し開始
        </button>
        <p className="text-xs text-orange-200 mt-3">クレジットカードが必要です。期間終了後は月額¥480（スタンダード）に移行します。</p>
      </div>
    </div>
  )
}
