# Phase 7: パフォーマンス最適化

## 📋 概要
画像・フォント最適化、コード分割、バンドル最適化により、アプリケーションのパフォーマンスを大幅に改善します。

**推定所要時間**: 1-2日

## ✅ Task 7.1: 画像とアセットの最適化

### 7.1.1: next/image への移行

**画像コンポーネントの最適化**
```tsx
// Before: 従来のimg要素
<img src="/images/logo.png" alt="サークルボード" width="200" height="50" />

// After: next/imageを使用
import Image from 'next/image'

<Image 
  src="/images/logo.png" 
  alt="サークルボード" 
  width={200} 
  height={50}
  priority // above-the-fold画像には priority を設定
  placeholder="blur" // ぼかしプレースホルダー
  blurDataURL="data:image/jpeg;base64,..." // Base64エンコードされた低画質画像
/>
```

**ファイル**: `components/ui/OptimizedImage.tsx`
```tsx
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className={`relative ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">画像を読み込めませんでした</span>
        </div>
      )}
    </div>
  )
}
```

**next.config.js の画像設定**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'example.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

module.exports = nextConfig
```

### 7.1.2: フォント最適化

**ファイル**: `lib/fonts.ts`
```typescript
import { Inter, Noto_Sans_JP } from 'next/font/google'
import localFont from 'next/font/local'

// Google Fonts
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

// ローカルフォント（カスタムフォント）
export const customFont = localFont({
  src: [
    {
      path: '../public/fonts/custom-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/custom-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-custom',
  display: 'swap',
})
```

**ファイル**: `app/layout.tsx` (フォント適用)
```tsx
import { inter, notoSansJP } from '@/lib/fonts'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="font-noto-sans-jp">
        {children}
      </body>
    </html>
  )
}
```

**CSS での使用**
```css
:root {
  --font-inter: 'Inter', sans-serif;
  --font-noto-sans-jp: 'Noto Sans JP', sans-serif;
}

body {
  font-family: var(--font-noto-sans-jp);
}

.heading {
  font-family: var(--font-inter);
}
```

## ✅ Task 7.2: コード分割とバンドル最適化

### 7.2.1: Dynamic Imports の実装

**重いコンポーネントの動的読み込み**
```tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// 重いチャートコンポーネントを動的読み込み
const DashboardChart = dynamic(
  () => import('@/components/dashboard/DashboardChart'),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false, // クライアントサイドでのみ読み込み
  }
)

// モーダルコンポーネントの動的読み込み
const GameModal = dynamic(
  () => import('@/components/modals/GameModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded animate-pulse">
          Loading...
        </div>
      </div>
    ),
  }
)

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <h1>ダッシュボード</h1>
      
      {/* 必要時のみ読み込まれるチャート */}
      <Suspense fallback={<div>Chart loading...</div>}>
        <DashboardChart />
      </Suspense>
      
      {/* モーダル表示時のみ読み込み */}
      {showModal && (
        <GameModal onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
```

### 7.2.2: Bundle Analyzer による分析

**インストール**
```bash
npm install --save-dev @next/bundle-analyzer
```

**next.config.js の設定**
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 既存の設定
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  
  // Tree shaking最適化
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.sideEffects = false
    }
    return config
  },
}

module.exports = withBundleAnalyzer(nextConfig)
```

**分析コマンドの追加**
```json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "build:analyze": "npm run build && npm run analyze"
  }
}
```

### 7.2.3: 不要な依存関係の除去

**package.json の最適化**
```bash
# 未使用のパッケージ検出
npm install --save-dev depcheck
npx depcheck

# パッケージサイズの分析
npm install --save-dev webpack-bundle-analyzer

# Tree shaking 対応のライブラリ使用
# lodash -> lodash-es
# moment -> date-fns
```

**最適化された import の例**
```typescript
// Before: 全体をインポート
import _ from 'lodash'
import * as dateFns from 'date-fns'

// After: 必要な関数のみインポート
import { debounce, throttle } from 'lodash-es'
import { format, addDays } from 'date-fns'

// アイコンライブラリの最適化
// Before: 全体をインポート
import * as Icons from 'lucide-react'

// After: 必要なアイコンのみインポート
import { Search, User, Settings } from 'lucide-react'
```

### 7.2.4: 実行時パフォーマンス最適化

**ファイル**: `components/ui/VirtualizedList.tsx`
```tsx
import { FixedSizeList as List } from 'react-window'
import { memo } from 'react'

interface VirtualizedListProps {
  items: any[]
  itemHeight: number
  height: number
  renderItem: (props: { index: number; style: any }) => React.ReactNode
}

const VirtualizedList = memo(function VirtualizedList({
  items,
  itemHeight,
  height,
  renderItem,
}: VirtualizedListProps) {
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={5} // 可視範囲外の追加レンダリング数
    >
      {renderItem}
    </List>
  )
})

export default VirtualizedList
```

**React の最適化フック活用**
```tsx
import { memo, useMemo, useCallback } from 'react'

// 重い計算の最適化
function ExpensiveComponent({ data }: { data: any[] }) {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: heavyCalculation(item)
    }))
  }, [data])

  const handleClick = useCallback((id: string) => {
    // イベントハンドラーの最適化
    console.log('Clicked:', id)
  }, [])

  return (
    <div>
      {processedData.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item} 
          onClick={handleClick}
        />
      ))}
    </div>
  )
}

// コンポーネントの最適化
const ItemComponent = memo(function ItemComponent({ item, onClick }) {
  return (
    <div onClick={() => onClick(item.id)}>
      {item.name}
    </div>
  )
})
```

## 📝 確認事項

### パフォーマンス最適化チェックリスト

- [ ] next/image による画像最適化
- [ ] フォント最適化の実装
- [ ] Dynamic Imports の設定
- [ ] Bundle Analyzer による分析完了
- [ ] 不要な依存関係の除去
- [ ] Tree shaking の設定
- [ ] React 最適化フックの活用
- [ ] 仮想化リストの実装（必要に応じて）

### パフォーマンステスト

1. **Lighthouse スコア測定**
```bash
npm install -g lighthouse
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

2. **Core Web Vitals 確認**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

3. **バンドルサイズ分析**
```bash
npm run analyze
# バンドルサイズの確認と最適化ポイントの特定
```

## ⚠️ 注意事項

1. **過度な最適化を避ける**
   - 実際のパフォーマンス問題を特定してから最適化
   - プリマチュア最適化は避ける

2. **ユーザビリティとのバランス**
   - ローディング状態の適切な表示
   - プログレッシブエンハンスメント

3. **メンテナビリティ**
   - 複雑な最適化はドキュメント化
   - パフォーマンス監視の継続

## 🔄 次のステップ

Phase 7 が完了したら、[Phase 8: テストとデバッグ](./08-phase8-testing.md) へ進みます。

## 📚 参考資料

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Web Vitals](https://web.dev/vitals/)

---

*最終更新: 2025-09-09*