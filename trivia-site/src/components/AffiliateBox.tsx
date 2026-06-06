type Product = {
  name: string
  url: string
  description: string
}

type Props = {
  products: Product[]
}

export default function AffiliateBox({ products }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 my-8">
      <p className="text-xs text-gray-400 mb-4">※当サイトはアフィリエイト広告を利用しています</p>
      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
        <span>📚</span> この記事に関連するおすすめ本
      </h3>
      <div className="space-y-3">
        {products.map((product, i) => (
          <div key={i} className="bg-white rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <p className="font-medium text-gray-800 text-sm">{product.name}</p>
              <p className="text-xs text-gray-500 mt-1">{product.description}</p>
            </div>
            <a
              href={product.url}
              className="shrink-0 bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              Amazonで見る
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
