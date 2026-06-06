import { articles, categories } from '@/data/articles'
import ArticleCard from '@/components/ArticleCard'
import AdBanner from '@/components/AdBanner'
import Link from 'next/link'
import { categoryEmojis } from '@/data/articles'

export const metadata = {
  title: '記事一覧',
  description: 'ザツガク王国のすべての雑学記事一覧。科学・歴史・動物・宇宙など多彩なジャンルから選べます。',
}

export default function ArticlesPage() {
  const popular = [...articles].sort((a, b) => a.readTime - b.readTime).slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">記事一覧</h1>
      <p className="text-gray-500 mb-8">全{articles.length}記事を掲載中</p>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/articles" className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium">すべて</Link>
        {categories.map(cat => (
          <Link
            key={cat}
            href={`/categories/${cat}`}
            className="bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 px-4 py-2 rounded-full text-sm font-medium border transition-colors"
          >
            {categoryEmojis[cat]} {cat}
          </Link>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:w-72 space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-bold text-gray-800 mb-4">🔥 人気の記事</h2>
            <ul className="space-y-3">
              {popular.map((a, i) => (
                <li key={a.id}>
                  <Link href={`/articles/${a.slug}`} className="flex items-start gap-3 hover:text-orange-500 transition-colors">
                    <span className="text-2xl font-bold text-orange-200 shrink-0">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 leading-snug">{a.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{a.category} · {a.readTime}分</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <AdBanner size="rectangle" />

          <div className="bg-gradient-to-br from-orange-400 to-pink-500 text-white rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">👑</div>
            <h3 className="font-bold mb-2">プレミアム会員</h3>
            <p className="text-xs text-orange-100 mb-4">全記事読み放題＋広告なし</p>
            <Link href="/premium" className="bg-white text-orange-500 font-bold text-sm px-5 py-2 rounded-full hover:bg-orange-50 transition-colors">
              詳細を見る
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
