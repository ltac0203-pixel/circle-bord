# Phase 5: API統合

## 📋 概要
Express サーバーの API を Next.js API Routes に移行し、データベース接続を最適化します。

**推定所要時間**: 2-3日

## ✅ Task 5.1: Express サーバーの API Routes 移行

### 5.1.1: データベース接続設定

**ファイル**: `lib/db.ts`
```typescript
import mysql from 'mysql2/promise'
import { Pool } from 'mysql2/promise'

let pool: Pool | null = null

// 接続プールの作成
export function createPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    })
  }
  return pool
}

// 単一接続の取得（トランザクション用）
export async function getConnection() {
  const pool = createPool()
  return pool.getConnection()
}

// クエリ実行ヘルパー
export async function executeQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T> {
  const pool = createPool()
  const [results] = await pool.execute(query, params)
  return results as T
}

// トランザクション実行ヘルパー
export async function executeTransaction<T>(
  callback: (connection: any) => Promise<T>
): Promise<T> {
  const connection = await getConnection()
  
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
```

### 5.1.2: ログイン API の移行

**ファイル**: `app/api/auth/login/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateUser } from '@/lib/db/users'
import { createToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { email, password } = validation.data
    
    // ユーザー認証
    const user = await validateUser(email, password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // トークン生成
    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email
    })
    
    // レスポンスの作成
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 200 }
    )
    
    // Cookieの設定
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 5.1.3: ユーザー登録 API

**ファイル**: `app/api/auth/register/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/db/users'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { name, email, password } = validation.data
    
    // 既存ユーザーのチェック
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }
    
    // ユーザー作成
    const user = await createUser(name, email, password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## ✅ Task 5.2: API エンドポイントの拡張

### 5.2.1: ゲーム管理 API

**ファイル**: `app/api/games/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { executeQuery } from '@/lib/db'
import { z } from 'zod'

const gameSchema = z.object({
  teamName: z.string().min(1),
  date: z.string(),
  time: z.string(),
  location: z.string().min(1),
  participants: z.number().min(1),
  description: z.string().optional()
})

// GET: ゲーム一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const games = await executeQuery(
      `SELECT * FROM games 
       WHERE date >= CURDATE() 
       ORDER BY date ASC, time ASC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )
    
    const total = await executeQuery<[{count: number}]>(
      'SELECT COUNT(*) as count FROM games WHERE date >= CURDATE()'
    )
    
    return NextResponse.json({
      games,
      total: total[0].count,
      limit,
      offset
    })
  } catch (error) {
    console.error('Games fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}

// POST: 新規ゲーム作成
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // バリデーション
    const validation = gameSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const data = validation.data
    
    const result = await executeQuery(
      `INSERT INTO games (team_name, date, time, location, participants, description, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.teamName,
        data.date,
        data.time,
        data.location,
        data.participants,
        data.description || null,
        session.user.id
      ]
    )
    
    const gameId = (result as any).insertId
    
    const [game] = await executeQuery(
      'SELECT * FROM games WHERE id = ?',
      [gameId]
    )
    
    return NextResponse.json(
      { success: true, game },
      { status: 201 }
    )
  } catch (error) {
    console.error('Game creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}
```

**ファイル**: `app/api/games/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { executeQuery } from '@/lib/db'

interface Params {
  params: {
    id: string
  }
}

// GET: 個別ゲーム取得
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const gameId = params.id
    
    const [game] = await executeQuery(
      'SELECT * FROM games WHERE id = ?',
      [gameId]
    )
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(game)
  } catch (error) {
    console.error('Game fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    )
  }
}

// PUT: ゲーム更新
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const gameId = params.id
    const body = await request.json()
    
    // 所有者チェック
    const [game] = await executeQuery<any[]>(
      'SELECT created_by FROM games WHERE id = ?',
      [gameId]
    )
    
    if (!game || game.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    await executeQuery(
      `UPDATE games 
       SET team_name = ?, date = ?, time = ?, location = ?, participants = ?, description = ? 
       WHERE id = ?`,
      [
        body.teamName,
        body.date,
        body.time,
        body.location,
        body.participants,
        body.description,
        gameId
      ]
    )
    
    const [updatedGame] = await executeQuery(
      'SELECT * FROM games WHERE id = ?',
      [gameId]
    )
    
    return NextResponse.json({
      success: true,
      game: updatedGame
    })
  } catch (error) {
    console.error('Game update error:', error)
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    )
  }
}

// DELETE: ゲーム削除
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const gameId = params.id
    
    // 所有者チェック
    const [game] = await executeQuery<any[]>(
      'SELECT created_by FROM games WHERE id = ?',
      [gameId]
    )
    
    if (!game || game.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    await executeQuery(
      'DELETE FROM games WHERE id = ?',
      [gameId]
    )
    
    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully'
    })
  } catch (error) {
    console.error('Game deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    )
  }
}
```

### 5.2.2: マッチング機能 API

**ファイル**: `app/api/applications/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { executeQuery, executeTransaction } from '@/lib/db'

// GET: 申請一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // 'sent' | 'received'
    
    let query: string
    let params: any[]
    
    if (type === 'sent') {
      // 送信した申請
      query = `
        SELECT a.*, g.team_name, g.date, g.time, g.location 
        FROM applications a 
        JOIN games g ON a.game_id = g.id 
        WHERE a.applicant_id = ? 
        ORDER BY a.created_at DESC
      `
      params = [session.user.id]
    } else {
      // 受信した申請
      query = `
        SELECT a.*, g.team_name, g.date, g.time, g.location, u.name as applicant_name 
        FROM applications a 
        JOIN games g ON a.game_id = g.id 
        JOIN users u ON a.applicant_id = u.id 
        WHERE g.created_by = ? 
        ORDER BY a.created_at DESC
      `
      params = [session.user.id]
    }
    
    const applications = await executeQuery(query, params)
    
    return NextResponse.json(applications)
  } catch (error) {
    console.error('Applications fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}

// POST: 新規申請作成
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { gameId, message } = body
    
    // 重複申請チェック
    const existing = await executeQuery(
      'SELECT id FROM applications WHERE game_id = ? AND applicant_id = ?',
      [gameId, session.user.id]
    )
    
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Already applied' },
        { status: 409 }
      )
    }
    
    const result = await executeQuery(
      `INSERT INTO applications (game_id, applicant_id, message, status) 
       VALUES (?, ?, ?, 'pending')`,
      [gameId, session.user.id, message || null]
    )
    
    const applicationId = (result as any).insertId
    
    const [application] = await executeQuery(
      'SELECT * FROM applications WHERE id = ?',
      [applicationId]
    )
    
    return NextResponse.json(
      { success: true, application },
      { status: 201 }
    )
  } catch (error) {
    console.error('Application creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
}
```

**ファイル**: `app/api/applications/[id]/[action]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { executeQuery, executeTransaction } from '@/lib/db'

interface Params {
  params: {
    id: string
    action: 'approve' | 'reject'
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { id: applicationId, action } = params
    
    // 申請情報と権限チェック
    const [application] = await executeQuery<any[]>(
      `SELECT a.*, g.created_by 
       FROM applications a 
       JOIN games g ON a.game_id = g.id 
       WHERE a.id = ?`,
      [applicationId]
    )
    
    if (!application || application.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Application already processed' },
        { status: 400 }
      )
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    
    await executeTransaction(async (connection) => {
      // 申請ステータス更新
      await connection.execute(
        'UPDATE applications SET status = ? WHERE id = ?',
        [newStatus, applicationId]
      )
      
      // 承認の場合、マッチを作成
      if (action === 'approve') {
        await connection.execute(
          `INSERT INTO matches (game_id, applicant_id, host_id, status) 
           VALUES (?, ?, ?, 'confirmed')`,
          [application.game_id, application.applicant_id, session.user.id]
        )
      }
      
      // 通知を作成
      await connection.execute(
        `INSERT INTO notifications (user_id, type, message, related_id) 
         VALUES (?, ?, ?, ?)`,
        [
          application.applicant_id,
          action === 'approve' ? 'application_approved' : 'application_rejected',
          `あなたの申請が${action === 'approve' ? '承認' : '拒否'}されました`,
          applicationId
        ]
      )
    })
    
    return NextResponse.json({
      success: true,
      message: `Application ${action}d successfully`
    })
  } catch (error) {
    console.error('Application action error:', error)
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    )
  }
}
```

## 📝 確認事項

### API実装チェックリスト

- [ ] データベース接続プールが設定されている
- [ ] 認証APIが実装されている
- [ ] ゲーム管理APIが実装されている
- [ ] マッチング機能APIが実装されている
- [ ] エラーハンドリングが適切に実装されている
- [ ] バリデーションが実装されている
- [ ] 認可チェックが実装されている

### 動作確認

1. **API エンドポイントのテスト**
```bash
# 開発サーバー起動
npm run dev

# API テスト（例）
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **データベース接続**
- 接続プールが正しく動作する
- トランザクションが正しく処理される
- エラー時のロールバック

3. **認可チェック**
- 未認証リクエストの拒否
- 権限のないリソースへのアクセス拒否

## ⚠️ 注意事項

1. **セキュリティ**
   - SQLインジェクション対策（パラメータ化クエリ）
   - 入力値のバリデーション
   - Rate Limiting の実装

2. **パフォーマンス**
   - 接続プールの適切な設定
   - インデックスの活用
   - N+1問題の回避

3. **エラーハンドリング**
   - 適切なHTTPステータスコード
   - エラーログの記録
   - ユーザーフレンドリーなエラーメッセージ

## 🔄 次のステップ

Phase 5 が完了したら、[Phase 6: データフェッチングの最適化](./06-phase6-data.md) へ進みます。

## 📚 参考資料

- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MySQL2](https://github.com/sidorares/node-mysql2)
- [Zod Validation](https://zod.dev/)

---

*最終更新: 2025-09-09*