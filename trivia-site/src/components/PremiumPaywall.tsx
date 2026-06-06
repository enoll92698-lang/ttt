import Link from 'next/link'

export default function PremiumPaywall() {
  return (
    <div className="relative">
      <div className="h-24 bg-gradient-to-b from-transparent to-white absolute bottom-0 left-0 right-0 z-10" />
      <div className="blur-sm pointer-events-none select-none text-gray-400 text-sm leading-relaxed">
        この先のコンテンツはプレミアム会員専用です。続きを読むには...
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-200 rounded-2xl p-8 text-center mt-6">
        <div className="text-4xl mb-3">👑</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">プレミアム会員限定コンテンツ</h3>
        <p className="text-gray-500 text-sm mb-6">この記事の続きはプレミアム会員のみお読みいただけます</p>
        <ul className="text-sm text-gray-600 mb-6 space-y-2 text-left max-w-xs mx-auto">
          {['全記事が読み放題', '広告なしで快適に閲覧', '限定の詳細解説・参考文献', '月2回の限定コンテンツ配信'].map(b => (
            <li key={b} className="flex items-center gap-2"><span className="text-green-500">✓</span>{b}</li>
          ))}
        </ul>
        <Link
          href="/premium"
          className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          プレミアムに登録する（月額¥480〜）
        </Link>
        <p className="text-xs text-gray-400 mt-3">いつでもキャンセル可能</p>
      </div>
    </div>
  )
}
