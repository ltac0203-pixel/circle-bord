# Phase 2: ルーティングとページ移行

## 📋 概要
React Router から Next.js App Router への移行を行い、ファイルベースルーティングを実装します。

**推定所要時間**: 2-3日

## ✅ Task 2.1: App Router 実装

### 2.1.1: ルートレイアウト作成

**ファイル**: `app/layout.tsx`
```tsx
import type { Metadata } from 'next'
import { Inter, Noto_Sans_JP } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const notoSansJP = Noto_Sans_JP({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp'
})

export const metadata: Metadata = {
  title: '大学サークル練習試合マッチング',
  description: '大学サークルの練習試合をマッチングするプラットフォーム',
  keywords: '大学, サークル, 練習試合, マッチング',
  authors: [{ name: 'Circle Board Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${inter.className} ${notoSansJP.variable}`}>
      <body>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}
```

**ファイル**: `app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
  --font-noto-sans-jp: 'Noto Sans JP', sans-serif;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: var(--font-noto-sans-jp);
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
    to bottom,
    transparent,
    rgb(var(--background-end-rgb))
  ) rgb(var(--background-start-rgb));
}

a {
  color: inherit;
  text-decoration: none;
}
```

### 2.1.2: ホームページ作成

**ファイル**: `app/page.tsx`
```tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function HomePage() {
  const session = await getSession()
  
  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/signin')
  }
}
```

### 2.1.3: 認証ページの移行

**ファイル**: `app/(auth)/layout.tsx`
```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        {children}
      </div>
    </div>
  )
}
```

**ファイル**: `app/(auth)/signin/page.tsx`
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      
      const result = await signIn(formData)
      
      if (result.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(result.error || 'ログインに失敗しました')
      }
    } catch (err) {
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          ログイン
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            新規登録
          </Link>
        </p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="email" className="sr-only">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

**ファイル**: `app/(auth)/signup/page.tsx`
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    setIsLoading(true)

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('email', formData.email)
      data.append('password', formData.password)
      
      const result = await signUp(data)
      
      if (result.success) {
        router.push('/signin')
      } else {
        setError(result.error || '登録に失敗しました')
      }
    } catch (err) {
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          新規登録
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          既にアカウントをお持ちの方は{' '}
          <Link href="/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
            ログイン
          </Link>
        </p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              名前
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="山田太郎"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="8文字以上"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              パスワード（確認）
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="パスワードを再入力"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '登録中...' : '登録'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

### 2.1.4: 保護されたルートの実装

**ファイル**: `app/(protected)/layout.tsx`
```tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Header from '@/components/layouts/Header'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

**ファイル**: `app/(protected)/dashboard/page.tsx`
```tsx
import { Suspense } from 'react'
import { getGames } from '@/lib/games'
import GameList from '@/components/GameList'
import DashboardSkeleton from '@/components/DashboardSkeleton'

export default async function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

async function DashboardContent() {
  const games = await getGames()
  
  return (
    <div className="grid gap-6">
      <section>
        <h2 className="text-2xl font-semibold mb-4">練習試合一覧</h2>
        <GameList games={games} />
      </section>
    </div>
  )
}
```

**ファイル**: `app/(protected)/dashboard/loading.tsx`
```tsx
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## ✅ Task 2.2: React Router から App Router への変換

### 2.2.1: ナビゲーション更新

**変換例: Link コンポーネント**

```tsx
// Before (React Router)
import { Link } from 'react-router-dom'
<Link to="/dashboard">ダッシュボード</Link>

// After (Next.js)
import Link from 'next/link'
<Link href="/dashboard">ダッシュボード</Link>
```

**変換例: useRouter**

```tsx
// Before (React Router)
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate('/dashboard')

// After (Next.js)
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/dashboard')
```

### 2.2.2: Middleware による認証

**ファイル**: `middleware.ts`
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  const isAuthPage = request.nextUrl.pathname.startsWith('/signin') || 
                     request.nextUrl.pathname.startsWith('/signup')
  
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }
  
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  if (token) {
    const verified = await verifyAuth(token.value)
    if (!verified) {
      const response = NextResponse.redirect(new URL('/signin', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## 📝 確認事項

### 移行完了チェックリスト

- [ ] ルートレイアウトが作成されている
- [ ] ホームページが作成されている
- [ ] 認証ページが移行されている
- [ ] 保護されたルートが実装されている
- [ ] ナビゲーションが更新されている
- [ ] Middleware が実装されている
- [ ] Loading 状態が実装されている
- [ ] Error 境界が設定されている

### 動作確認

1. **ルーティングの確認**
```bash
npm run dev
# http://localhost:3000 にアクセス
```

2. **認証フローの確認**
- ログインページへのリダイレクト
- ログイン後のダッシュボードへの遷移
- ログアウト処理

3. **保護されたルートの確認**
- 未認証時のリダイレクト
- 認証済みユーザーのアクセス

## ⚠️ 注意事項

1. **Server Components と Client Components**
   - インタラクティブな要素には 'use client' を追加
   - データフェッチは Server Components で実行

2. **ハイドレーションエラー**
   - サーバーとクライアントで異なる内容をレンダリングしない
   - 条件付きレンダリングに注意

3. **パフォーマンス**
   - 不要な Client Components を避ける
   - Suspense を活用した並列データフェッチ

## 🔄 次のステップ

Phase 2 が完了したら、[Phase 3: コンポーネント移行](./03-phase3-components.md) へ進みます。

## 📚 参考資料

- [App Router ドキュメント](https://nextjs.org/docs/app)
- [ルーティングの基礎](https://nextjs.org/docs/app/building-your-application/routing)
- [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

*最終更新: 2025-09-09*