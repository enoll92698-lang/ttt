import Link from 'next/link'
import { Article } from '@/data/articles'
import CategoryBadge from './CategoryBadge'

type Props = {
  article: Article
}

export default function ArticleCard({ article }: Props) {
  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-8 flex items-center justify-center text-6xl">
          {article.emoji}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-3">
            <CategoryBadge category={article.category} size="sm" />
            <div className="flex items-center gap-2">
              {article.isPremium && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">👑 Premium</span>
              )}
              <span className="text-xs text-gray-400">{article.readTime}分</span>
            </div>
          </div>
          <h3 className="font-bold text-gray-800 text-base mb-2 leading-snug flex-1">{article.title}</h3>
          <p className="text-gray-500 text-sm line-clamp-2">{article.excerpt}</p>
          <p className="text-xs text-gray-400 mt-3">{article.publishedAt}</p>
        </div>
      </div>
    </Link>
  )
}
