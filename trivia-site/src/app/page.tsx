import Link from 'next/link'
import { articles, categories, categoryEmojis } from '@/data/articles'
import ArticleCard from '@/components/ArticleCard'
import AdBanner from '@/components/AdBanner'

export default function Home() {
  const featured = articles.slice(0, 6)
  const todayArticle = articles[Math.floor(articles.length / 2)]

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🧠</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            毎日発見！<br />おもしろ雑学の世界
          </h1>
          <p className="text-xl text-orange-100 mb-8">
            科学・歴史・動物・宇宙など、あなたの知的好奇心を満たす雑学をお届けします
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/articles"
              className="bg-white text-orange-500 font-bold px-8 py-4 rounded-full hover:bg-orange-50 transition-colors text-lg"
            >
              記事を読む 📖
            </Link>
            <Link
              href="/premium"
              className="bg-yellow-400 text-yellow-900 font-bold px-8 py-4 rounded-full hover:bg-yellow-300 transition-colors text-lg"
            >
              👑 プレミアム会員になる
            </Link>
          </div>
        </div>
      </section>

      {/* Today's trivia */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="text-5xl">{todayArticle.emoji}</div>
          <div className="flex-1">
            <p className="text-teal-100 text-sm font-medium mb-1">💡 今日の雑学</p>
            <h2 className="text-xl font-bold mb-2">{todayArticle.title}</h2>
            <p className="text-teal-100 text-sm">{todayArticle.excerpt}</p>
          </div>
          <Link
            href={`/articles/${todayArticle.slug}`}
            className="bg-white text-teal-600 font-bold px-6 py-3 rounded-full hover:bg-teal-50 transition-colors shrink-0"
          >
            読む →
          </Link>
        </div>
      </section>

      {/* Ad banner */}
      <div className="max-w-6xl mx-auto px-4">
        <AdBanner size="leaderboard" />
      </div>

      {/* Featured articles */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">注目の記事</span>
          </h2>
          <Link href="/articles" className="text-orange-500 hover:text-orange-600 font-medium text-sm">
            すべて見る →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">カテゴリから探す</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map(cat => (
              <Link
                key={cat}
                href={`/categories/${cat}`}
                className="bg-orange-50 hover:bg-orange-100 rounded-2xl p-5 text-center transition-colors"
              >
                <div className="text-4xl mb-2">{categoryEmojis[cat]}</div>
                <div className="font-bold text-gray-700">{cat}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-10 text-center text-white">
          <div className="text-5xl mb-4">👑</div>
          <h2 className="text-3xl font-bold mb-3">プレミアム会員でもっと深く</h2>
          <p className="text-yellow-100 mb-6 max-w-xl mx-auto">
            プレミアム会員なら全記事読み放題＋広告なし。月額¥480からご利用いただけます。
          </p>
          <ul className="flex flex-col sm:flex-row gap-4 justify-center text-sm mb-8">
            {['✅ 全記事読み放題', '✅ 広告なし', '✅ 限定コンテンツ', '✅ いつでもキャンセル'].map(f => (
              <li key={f} className="bg-white bg-opacity-20 rounded-full px-4 py-2">{f}</li>
            ))}
          </ul>
          <Link
            href="/premium"
            className="inline-block bg-white text-orange-500 font-bold px-10 py-4 rounded-full hover:bg-orange-50 transition-colors text-lg"
          >
            プレミアムを試す
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gray-800 text-white py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">📧 毎日届く雑学メルマガ</h2>
          <p className="text-gray-400 mb-6">毎朝1つの雑学をメールでお届けします。無料登録受付中！</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" action="#">
            <input
              type="email"
              placeholder="メールアドレスを入力"
              className="flex-1 px-5 py-3 rounded-full text-gray-800 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-full transition-colors"
            >
              登録する
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
