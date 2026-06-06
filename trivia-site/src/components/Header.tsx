'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">🧠</span>
          <div>
            <div className="font-bold text-xl text-gray-800">ザツガク王国</div>
            <div className="text-xs text-gray-400">毎日発見！おもしろ雑学</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">ホーム</Link>
          <Link href="/articles" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">記事一覧</Link>
          <Link href="/categories/科学" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">カテゴリ</Link>
          <Link href="/premium" className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-5 py-2 rounded-full font-bold hover:opacity-90 transition-opacity text-sm">
            👑 プレミアム登録
          </Link>
        </nav>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
        >
          <div className="w-5 h-0.5 bg-gray-600 mb-1" />
          <div className="w-5 h-0.5 bg-gray-600 mb-1" />
          <div className="w-5 h-0.5 bg-gray-600" />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 flex flex-col gap-3">
          <Link href="/" className="text-gray-700 py-2 border-b" onClick={() => setMenuOpen(false)}>ホーム</Link>
          <Link href="/articles" className="text-gray-700 py-2 border-b" onClick={() => setMenuOpen(false)}>記事一覧</Link>
          <Link href="/categories/科学" className="text-gray-700 py-2 border-b" onClick={() => setMenuOpen(false)}>カテゴリ</Link>
          <Link href="/premium" className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-5 py-2 rounded-full font-bold text-center" onClick={() => setMenuOpen(false)}>
            👑 プレミアム登録
          </Link>
        </div>
      )}
    </header>
  )
}
