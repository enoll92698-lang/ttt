type Props = {
  size: 'leaderboard' | 'rectangle' | 'banner'
}

const sizes = {
  leaderboard: 'w-full h-24',
  rectangle:   'w-64 h-64',
  banner:      'w-full h-16',
}

export default function AdBanner({ size }: Props) {
  return (
    <div className={`${sizes[size]} bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center`}>
      <div className="text-center">
        <p className="text-gray-400 text-xs font-medium">広 告</p>
        {/* 本番では以下のAdSenseコードに置き換えてください:
        <ins className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="auto"
          data-full-width-responsive="true" />
        */}
      </div>
    </div>
  )
}
