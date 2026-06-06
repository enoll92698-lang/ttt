import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ザツガク王国 | 毎日発見！おもしろ雑学',
    template: '%s | ザツガク王国',
  },
  description: '科学・歴史・動物・宇宙・食べ物など様々なジャンルの面白い雑学・トリビアを毎日お届けします。知識を広げながら楽しく学べるサイトです。',
  keywords: ['雑学', 'トリビア', '豆知識', '科学', '歴史', '動物', '宇宙'],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'ザツガク王国',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
        {/* AdSense: 本番では以下のコメントを外してください
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous" />
        */}
      </head>
      <body className="bg-orange-50 font-sans min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
