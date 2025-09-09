import type { Metadata } from 'next'
import { inter, notoSansJP } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: '大学サークル練習試合マッチング',
  description: '大学サークルの練習試合をマッチングするプラットフォーム',
  keywords: '大学, サークル, 練習試合, マッチング',
  authors: [{ name: 'Circle Board Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="font-noto-sans-jp">
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}