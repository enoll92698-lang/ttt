import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🧠</span>
              <span className="text-white font-bold text-lg">ザツガク王国</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              毎日新しい発見をお届け。科学・歴史・動物・宇宙など様々なジャンルの面白い雑学を分かりやすく紹介します。
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">コンテンツ</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-orange-400 transition-colors">ホーム</Link></li>
              <li><Link href="/articles" className="hover:text-orange-400 transition-colors">記事一覧</Link></li>
              <li><Link href="/premium" className="hover:text-orange-400 transition-colors">プレミアム会員</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">カテゴリ</h3>
            <ul className="space-y-2 text-sm">
              {['科学', '歴史', '動物', '食べ物', '宇宙', '人体'].map(cat => (
                <li key={cat}>
                  <Link href={`/categories/${cat}`} className="hover:text-orange-400 transition-colors">{cat}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">サポート</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-orange-400 transition-colors">お問い合わせ</Link></li>
              <li><Link href="#" className="hover:text-orange-400 transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="#" className="hover:text-orange-400 transition-colors">利用規約</Link></li>
              <li><Link href="#" className="hover:text-orange-400 transition-colors">広告掲載について</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 ザツガク王国. All rights reserved.</p>
          <p className="text-xs text-gray-600">当サイトはアフィリエイト広告（Amazonアソシエイト等）を利用しています。</p>
        </div>
      </div>
    </footer>
  )
}
