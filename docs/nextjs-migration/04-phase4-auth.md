# Phase 4: 認証システムの再実装

## 📋 概要
Context APIベースの認証システムをNext.js App Router対応に再実装し、Server ActionsとMiddlewareを活用した堅牢な認証フローを構築します。

**推定所要時間**: 2日

## ✅ Task 4.1: Next.js 対応の認証実装

### 4.1.1: 認証ユーティリティ作成

**ファイル**: `lib/auth.ts`
```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export interface User {
  id: string
  name: string
  email: string
}

export interface Session {
  user: User
  expires: string
}

// JWTトークンの作成
export async function createToken(user: User): Promise<string> {
  const token = await new SignJWT({ 
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
  
  return token
}

// JWTトークンの検証
export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as Session
  } catch (error) {
    return null
  }
}

// セッションの取得
export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')
  
  if (!token) {
    return null
  }
  
  return verifyToken(token.value)
}

// セッションの作成
export async function createSession(user: User): Promise<void> {
  const token = await createToken(user)
  const cookieStore = cookies()
  
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24時間
    path: '/'
  })
}

// セッションの削除
export async function destroySession(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete('auth-token')
}

// パスワードのハッシュ化
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// パスワードの検証
export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Middleware用の認証検証
export async function verifyAuth(token: string): Promise<boolean> {
  const session = await verifyToken(token)
  return session !== null
}
```

### 4.1.2: データベース接続とユーザーモデル

**ファイル**: `lib/db/users.ts`
```typescript
import { getConnection } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'

export interface UserRecord {
  id: string
  name: string
  email: string
  password: string
  created_at: Date
  updated_at: Date
}

// ユーザーの作成
export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<UserRecord | null> {
  const connection = await getConnection()
  
  try {
    const hashedPassword = await hashPassword(password)
    
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    )
    
    const userId = (result as any).insertId
    
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    )
    
    return (rows as UserRecord[])[0]
  } catch (error) {
    console.error('ユーザー作成エラー:', error)
    return null
  } finally {
    await connection.end()
  }
}

// メールアドレスでユーザーを検索
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const connection = await getConnection()
  
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    
    const users = rows as UserRecord[]
    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error('ユーザー検索エラー:', error)
    return null
  } finally {
    await connection.end()
  }
}

// ログイン検証
export async function validateUser(
  email: string,
  password: string
): Promise<UserRecord | null> {
  const user = await findUserByEmail(email)
  
  if (!user) {
    return null
  }
  
  const isValid = await verifyPassword(password, user.password)
  
  return isValid ? user : null
}
```

### 4.1.3: AuthProvider の更新

**ファイル**: `components/providers/AuthProvider.tsx`
```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {}
})

export function AuthProvider({ 
  children,
  initialUser
}: { 
  children: React.ReactNode
  initialUser: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // クライアントサイドでの追加の初期化処理（必要に応じて）
    setLoading(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**ファイル**: `app/(protected)/layout.tsx` (更新版)
```tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AuthProvider } from '@/components/providers/AuthProvider'
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
    <AuthProvider initialUser={session.user}>
      <div className="min-h-screen bg-gray-50">
        <Header user={session.user} />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
```

## ✅ Task 4.2: 認証フローの最適化

### 4.2.1: Server Actions の実装

**ファイル**: `app/actions/auth.ts`
```typescript
'use server'

import { redirect } from 'next/navigation'
import { createSession, destroySession } from '@/lib/auth'
import { createUser, validateUser } from '@/lib/db/users'
import { z } from 'zod'

// バリデーションスキーマ
const signInSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります')
})

const signUpSchema = z.object({
  name: z.string().min(1, '名前を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります')
})

// サインイン
export async function signIn(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string
  }

  // バリデーション
  const validation = signInSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message
    }
  }

  // ユーザー認証
  const user = await validateUser(rawData.email, rawData.password)
  
  if (!user) {
    return {
      success: false,
      error: 'メールアドレスまたはパスワードが正しくありません'
    }
  }

  // セッション作成
  await createSession({
    id: user.id,
    name: user.name,
    email: user.email
  })

  return {
    success: true
  }
}

// サインアップ
export async function signUp(formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string
  }

  // バリデーション
  const validation = signUpSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message
    }
  }

  // ユーザー作成
  const user = await createUser(
    rawData.name,
    rawData.email,
    rawData.password
  )
  
  if (!user) {
    return {
      success: false,
      error: 'ユーザーの作成に失敗しました。メールアドレスが既に使用されている可能性があります。'
    }
  }

  return {
    success: true
  }
}

// サインアウト
export async function signOut() {
  await destroySession()
  redirect('/signin')
}
```

### 4.2.2: Middleware での認証チェック（更新版）

**ファイル**: `middleware.ts`
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'

// 公開ルート（認証不要）
const publicRoutes = ['/signin', '/signup', '/']
const authRoutes = ['/signin', '/signup']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)
  const isAuthRoute = authRoutes.includes(path)
  
  const token = request.cookies.get('auth-token')?.value
  const isAuthenticated = token ? await verifyAuth(token) : false
  
  // 認証ページへのアクセス（ログイン済みの場合はダッシュボードへ）
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // 保護されたルートへのアクセス（未認証の場合はログインページへ）
  if (!isPublicRoute && !isAuthenticated) {
    const response = NextResponse.redirect(new URL('/signin', request.url))
    response.cookies.delete('auth-token')
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのリクエストパスにマッチ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### 4.2.3: クライアントサイドの認証フック

**ファイル**: `hooks/useAuthStatus.ts`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      const data = await response.json()
      
      setIsAuthenticated(data.authenticated)
    } catch (error) {
      console.error('認証状態の確認エラー:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAuth = () => {
    router.refresh()
    checkAuthStatus()
  }

  return {
    isAuthenticated,
    isLoading,
    refreshAuth
  }
}
```

**ファイル**: `app/api/auth/status/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  
  return NextResponse.json({
    authenticated: !!session,
    user: session?.user || null
  })
}
```

## 📝 確認事項

### 実装完了チェックリスト

- [ ] 認証ユーティリティが作成されている
- [ ] JWTトークンの生成・検証が動作する
- [ ] セッション管理が実装されている
- [ ] パスワードのハッシュ化が実装されている
- [ ] Server Actions が実装されている
- [ ] Middleware が正しく動作する
- [ ] AuthProvider が更新されている
- [ ] データベース接続が設定されている

### セキュリティチェックリスト

- [ ] パスワードが適切にハッシュ化されている
- [ ] JWTシークレットが環境変数で管理されている
- [ ] HTTPOnly Cookieが使用されている
- [ ] CSRF対策が実装されている
- [ ] XSS対策が実装されている
- [ ] SQLインジェクション対策が実装されている

### 動作確認

1. **認証フロー**
```bash
npm run dev
# 以下を確認:
# - サインアップ機能
# - サインイン機能
# - サインアウト機能
```

2. **セッション管理**
- ページリロード後もログイン状態が維持される
- 24時間後に自動ログアウト
- 複数タブでの同期

3. **保護されたルート**
- 未認証時のリダイレクト
- 認証済みユーザーのアクセス

## ⚠️ 注意事項

1. **セキュリティ**
   - 本番環境では必ず強力なJWTシークレットを使用
   - HTTPS環境でのみSecure Cookieを有効化
   - Rate Limitingの実装を検討

2. **パフォーマンス**
   - データベース接続プールの使用
   - キャッシング戦略の実装

3. **エラーハンドリング**
   - 適切なエラーメッセージの表示
   - ログの記録

## 🔄 次のステップ

Phase 4 が完了したら、[Phase 5: API統合](./05-phase5-api.md) へ進みます。

## 📚 参考資料

- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [NextAuth.js](https://next-auth.js.org/) (代替オプション)

---

*最終更新: 2025-09-09*