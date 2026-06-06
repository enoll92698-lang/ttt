import { notFound } from 'next/navigation'
import { articles, categories, categoryEmojis } from '@/data/articles'
import ArticleCard from '@/components/ArticleCard'
import Link from 'next/link'

export function generateStaticParams() {
  return categories.map(category => ({ category }))
}

export function generateMetadata({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category)
  return {
    title: `${category}の雑学`,
    description: `${category}に関するおもしろい雑学・トリビアをまとめています。`,
  }
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category)
  if (!categories.includes(category)) notFound()

  const categoryArticles = articles.filter(a => a.category === category)
  const emoji = categoryEmojis[category] ?? '📌'

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Category header */}
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 text-white rounded-2xl p-10 mb-10 text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h1 className="text-3xl font-bold mb-2">{category}の雑学</h1>
        <p className="text-orange-100">{categoryArticles.length}件の記事</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/articles" className="bg-white text-gray-600 hover:bg-orange-50 px-4 py-2 rounded-full text-sm font-medium border transition-colors">
          すべて
        </Link>
        {categories.map(cat => (
          <Link
            key={cat}
            href={`/categories/${cat}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              cat === category
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-orange-50 border'
            }`}
          >
            {categoryEmojis[cat]} {cat}
          </Link>
        ))}
      </div>

      {categoryArticles.length === 0 ? (
        <p className="text-gray-400 text-center py-20">このカテゴリの記事はまだありません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
