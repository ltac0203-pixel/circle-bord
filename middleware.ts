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