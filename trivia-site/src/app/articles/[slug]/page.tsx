import { notFound } from 'next/navigation'
import { articles } from '@/data/articles'
import CategoryBadge from '@/components/CategoryBadge'
import AdBanner from '@/components/AdBanner'
import AffiliateBox from '@/components/AffiliateBox'
import PremiumPaywall from '@/components/PremiumPaywall'
import ArticleCard from '@/components/ArticleCard'
import Link from 'next/link'

export function generateStaticParams() {
  return articles.map(a => ({ slug: a.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const article = articles.find(a => a.slug === params.slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.excerpt,
  }
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articles.find(a => a.slug === params.slug)
  if (!article) notFound()

  const related = articles
    .filter(a => a.id !== article.id && a.category === article.category)
    .slice(0, 3)

  const [firstParagraph, ...rest] = article.content.trim().split('</p>')

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-orange-500">ホーム</Link>
        <span>/</span>
        <Link href="/articles" className="hover:text-orange-500">記事一覧</Link>
        <span>/</span>
        <span className="text-gray-600">{article.title}</span>
      </nav>

      <article>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-6">{article.emoji}</div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <CategoryBadge category={article.category} />
            {article.isPremium && (
              <span className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded-full font-medium">👑 Premium</span>
            )}
            <span className="text-sm text-gray-400">{article.readTime}分で読める</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">{article.title}</h1>
          <p className="text-gray-500 mt-3">{article.publishedAt}</p>
        </div>

        {/* First paragraph + ad */}
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: firstParagraph + '</p>' }} />
        <div className="my-6">
          <AdBanner size="leaderboard" />
        </div>

        {/* Rest of content */}
        {article.isPremium ? (
          <>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: rest[0] ? rest[0] + '</p>' : '' }}
            />
            <PremiumPaywall />
          </>
        ) : (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: rest.join('</p>') + (rest.length ? '</p>' : '') }}
          />
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-8">
          {article.tags.map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">#{tag}</span>
          ))}
        </div>

        {/* Social share */}
        <div className="flex items-center gap-3 mt-6 py-6 border-t">
          <span className="text-sm text-gray-500 font-medium">シェアする:</span>
          <button className="bg-sky-400 text-white text-sm px-4 py-2 rounded-full hover:bg-sky-500 transition-colors">𝕏 Twitter</button>
          <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">Facebook</button>
          <button className="bg-green-500 text-white text-sm px-4 py-2 rounded-full hover:bg-green-600 transition-colors">LINE</button>
        </div>

        {/* Affiliate */}
        {article.affiliateProducts && article.affiliateProducts.length > 0 && (
          <AffiliateBox products={article.affiliateProducts} />
        )}
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-5">関連記事</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map(a => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* Bottom ad */}
      <div className="mt-10">
        <AdBanner size="leaderboard" />
      </div>
    </div>
  )
}
