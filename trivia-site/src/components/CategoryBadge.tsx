import { categoryColors, categoryEmojis } from '@/data/articles'

type Props = {
  category: string
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ category, size = 'md' }: Props) {
  const color = categoryColors[category] ?? 'bg-gray-100 text-gray-700'
  const emoji = categoryEmojis[category] ?? '📌'
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${color} ${sizeClass}`}>
      {emoji} {category}
    </span>
  )
}
