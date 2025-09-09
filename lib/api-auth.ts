import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, User } from '@/lib/auth'
import { cookies } from 'next/headers'

export interface ApiError {
  error: string
  status?: number
}

// 認証ユーザーを取得
export async function getAuthUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')

    if (!authToken) {
      return null
    }

    const session = await verifyToken(authToken.value)
    
    if (!session || !session.user) {
      return null
    }

    // トークンの有効期限チェック
    const expiresAt = new Date(session.expires)
    if (expiresAt < new Date()) {
      return null
    }

    return session.user
  } catch (error) {
    console.error('認証エラー:', error)
    return null
  }
}

// 認証必須のチェック
export async function requireAuth(): Promise<User | NextResponse> {
  const user = await getAuthUser()
  
  if (!user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    )
  }
  
  return user
}

// ユーザー権限チェック
export function checkUserPermission(
  resourceOwnerId: string,
  currentUserId: string
): boolean {
  return resourceOwnerId === currentUserId
}

// APIレスポンスヘルパー
export class ApiResponse {
  static success<T>(data: T, status: number = 200): NextResponse<{ success: true; data: T }> {
    return NextResponse.json({ success: true, data }, { status })
  }

  static error(
    message: string, 
    status: number = 400, 
    details?: any
  ): NextResponse<{ success: false; error: string; details?: any }> {
    return NextResponse.json(
      { success: false, error: message, details },
      { status }
    )
  }

  static unauthorized(message: string = '認証が必要です'): NextResponse<{ success: false; error: string }> {
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    )
  }

  static forbidden(message: string = 'アクセス権限がありません'): NextResponse<{ success: false; error: string }> {
    return NextResponse.json(
      { success: false, error: message },
      { status: 403 }
    )
  }

  static notFound(message: string = 'リソースが見つかりません'): NextResponse<{ success: false; error: string }> {
    return NextResponse.json(
      { success: false, error: message },
      { status: 404 }
    )
  }

  static serverError(message: string = 'サーバーエラーが発生しました'): NextResponse<{ success: false; error: string }> {
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// バリデーションヘルパー
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): string[] {
  const missing: string[] = []
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field)
    }
  }
  
  return missing
}

// リクエストボディのパースと検証
export async function parseRequestBody<T>(
  req: NextRequest,
  requiredFields: string[] = []
): Promise<{ success: true; data: T } | { success: false; error: string; missing?: string[] }> {
  try {
    const body = await req.json()
    
    if (requiredFields.length > 0) {
      const missing = validateRequiredFields(body, requiredFields)
      if (missing.length > 0) {
        return {
          success: false,
          error: `必須フィールドが不足しています: ${missing.join(', ')}`,
          missing
        }
      }
    }
    
    return { success: true, data: body as T }
  } catch (error) {
    return {
      success: false,
      error: '無効なJSONデータです'
    }
  }
}

// HTTPメソッドチェック
export function checkHttpMethod(
  req: NextRequest,
  allowedMethods: string[]
): { success: true } | { success: false; error: string } {
  if (!allowedMethods.includes(req.method)) {
    return {
      success: false,
      error: `${req.method}メソッドは許可されていません`
    }
  }
  return { success: true }
}