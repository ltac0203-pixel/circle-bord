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
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')
  
  if (!token) {
    return null
  }
  
  return verifyToken(token.value)
}

// セッションの作成
export async function createSession(user: User): Promise<void> {
  const token = await createToken(user)
  const cookieStore = await cookies()
  
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
  const cookieStore = await cookies()
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