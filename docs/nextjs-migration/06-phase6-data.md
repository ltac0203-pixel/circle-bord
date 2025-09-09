# Phase 6: データフェッチングの最適化

## 📋 概要
Next.js App RouterのServer ComponentsとClient Componentsを活用し、効率的なデータフェッチングとキャッシング戦略を実装します。

**推定所要時間**: 2日

## ✅ Task 6.1: Server Components でのデータフェッチ

### 6.1.1: データフェッチ関数の作成

**ファイル**: `lib/data/games.ts`
```typescript
import { executeQuery } from '@/lib/db'
import { cache } from 'react'

export interface Game {
  id: string
  team_name: string
  date: string
  time: string
  location: string
  participants: number
  description?: string
  created_by: string
  created_at: string
  updated_at: string
}

// キャッシュ付きのゲーム一覧取得
export const getGames = cache(async (
  limit: number = 20,
  offset: number = 0
): Promise<Game[]> => {
  const games = await executeQuery<Game[]>(
    `SELECT * FROM games 
     WHERE date >= CURDATE() 
     ORDER BY date ASC, time ASC 
     LIMIT ? OFFSET ?`,
    [limit, offset]
  )
  
  return games
})

// ユーザーのゲーム一覧取得
export const getUserGames = cache(async (userId: string): Promise<Game[]> => {
  const games = await executeQuery<Game[]>(
    `SELECT * FROM games 
     WHERE created_by = ? 
     ORDER BY date DESC`,
    [userId]
  )
  
  return games
})

// 個別ゲーム取得
export const getGame = cache(async (id: string): Promise<Game | null> => {
  const [game] = await executeQuery<Game[]>(
    'SELECT * FROM games WHERE id = ?',
    [id]
  )
  
  return game || null
})

// 統計データ取得
export const getGameStats = cache(async (userId: string) => {
  const [stats] = await executeQuery<any[]>(`
    SELECT 
      COUNT(*) as total_games,
      COUNT(CASE WHEN date >= CURDATE() THEN 1 END) as upcoming_games,
      COUNT(CASE WHEN date < CURDATE() THEN 1 END) as past_games
    FROM games 
    WHERE created_by = ?
  `, [userId])
  
  return stats
})
```

**ファイル**: `lib/data/applications.ts`
```typescript
import { executeQuery } from '@/lib/db'
import { cache } from 'react'

export interface Application {
  id: string
  game_id: string
  applicant_id: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  // JOIN結果
  team_name?: string
  date?: string
  time?: string
  location?: string
  applicant_name?: string
}

// 受信した申請一覧
export const getReceivedApplications = cache(async (userId: string): Promise<Application[]> => {
  const applications = await executeQuery<Application[]>(`
    SELECT a.*, g.team_name, g.date, g.time, g.location, u.name as applicant_name 
    FROM applications a 
    JOIN games g ON a.game_id = g.id 
    JOIN users u ON a.applicant_id = u.id 
    WHERE g.created_by = ? 
    ORDER BY a.created_at DESC
  `, [userId])
  
  return applications
})

// 送信した申請一覧
export const getSentApplications = cache(async (userId: string): Promise<Application[]> => {
  const applications = await executeQuery<Application[]>(`
    SELECT a.*, g.team_name, g.date, g.time, g.location 
    FROM applications a 
    JOIN games g ON a.game_id = g.id 
    WHERE a.applicant_id = ? 
    ORDER BY a.created_at DESC
  `, [userId])
  
  return applications
})

// 承認待ち申請数
export const getPendingApplicationsCount = cache(async (userId: string): Promise<number> => {
  const [result] = await executeQuery<{count: number}[]>(`
    SELECT COUNT(*) as count 
    FROM applications a 
    JOIN games g ON a.game_id = g.id 
    WHERE g.created_by = ? AND a.status = 'pending'
  `, [userId])
  
  return result.count
})
```

### 6.1.2: 非同期 Server Components の実装

**ファイル**: `app/(protected)/dashboard/page.tsx` (更新版)
```tsx
import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { getGames, getGameStats } from '@/lib/data/games'
import { getPendingApplicationsCount } from '@/lib/data/applications'
import DashboardStats from '@/components/dashboard/DashboardStats'
import GameList from '@/components/GameList'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) {
    return null // middleware がリダイレクトするため
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
      
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded"></div>}>
        <StatsSection userId={session.user.id} />
      </Suspense>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <GamesSection />
      </Suspense>
    </div>
  )
}

async function StatsSection({ userId }: { userId: string }) {
  const [gameStats, pendingCount] = await Promise.all([
    getGameStats(userId),
    getPendingApplicationsCount(userId)
  ])

  return (
    <DashboardStats
      totalGames={gameStats.total_games}
      pendingApplications={pendingCount}
      upcomingMatches={gameStats.upcoming_games}
    />
  )
}

async function GamesSection() {
  const games = await getGames(10, 0)

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">最新の練習試合</h2>
      <GameList games={games} />
    </section>
  )
}
```

### 6.1.3: キャッシング戦略の実装

**ファイル**: `lib/data/cache.ts`
```typescript
import { unstable_cache } from 'next/cache'

// タグベースキャッシュヘルパー
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  tags: string[],
  revalidate?: number
) {
  return unstable_cache(
    fn,
    [keyPrefix],
    {
      tags,
      revalidate
    }
  )
}

// よく使用されるキャッシュタグ
export const CACHE_TAGS = {
  GAMES: 'games',
  APPLICATIONS: 'applications',
  USERS: 'users',
  MATCHES: 'matches'
} as const

// キャッシュ無効化ヘルパー
export function invalidateCache(tags: string[]) {
  // Next.js のrevalidateTag APIを使用（実装時）
  // tags.forEach(tag => revalidateTag(tag))
}
```

**ファイル**: `lib/data/games.ts` (キャッシュ最適化版)
```typescript
import { executeQuery } from '@/lib/db'
import { createCachedFunction, CACHE_TAGS } from './cache'

export const getGames = createCachedFunction(
  async (limit: number = 20, offset: number = 0) => {
    const games = await executeQuery<Game[]>(
      `SELECT * FROM games 
       WHERE date >= CURDATE() 
       ORDER BY date ASC, time ASC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )
    return games
  },
  'games-list',
  [CACHE_TAGS.GAMES],
  60 // 1分間キャッシュ
)

export const getUserGames = createCachedFunction(
  async (userId: string) => {
    const games = await executeQuery<Game[]>(
      `SELECT * FROM games 
       WHERE created_by = ? 
       ORDER BY date DESC`,
      [userId]
    )
    return games
  },
  'user-games',
  [CACHE_TAGS.GAMES],
  300 // 5分間キャッシュ
)
```

## ✅ Task 6.2: Client-Server データ同期

### 6.2.1: Server Actions の実装

**ファイル**: `app/actions/games.ts`
```typescript
'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { executeQuery } from '@/lib/db'
import { CACHE_TAGS } from '@/lib/data/cache'
import { z } from 'zod'

const gameSchema = z.object({
  teamName: z.string().min(1, 'チーム名を入力してください'),
  date: z.string().min(1, '日付を選択してください'),
  time: z.string().min(1, '時間を選択してください'),
  location: z.string().min(1, '場所を入力してください'),
  participants: z.number().min(1, '参加人数を入力してください'),
  description: z.string().optional()
})

export async function createGame(formData: FormData) {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  const rawData = {
    teamName: formData.get('teamName') as string,
    date: formData.get('date') as string,
    time: formData.get('time') as string,
    location: formData.get('location') as string,
    participants: parseInt(formData.get('participants') as string),
    description: formData.get('description') as string
  }

  const validation = gameSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message
    }
  }

  try {
    await executeQuery(
      `INSERT INTO games (team_name, date, time, location, participants, description, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        validation.data.teamName,
        validation.data.date,
        validation.data.time,
        validation.data.location,
        validation.data.participants,
        validation.data.description || null,
        session.user.id
      ]
    )

    // キャッシュを無効化
    revalidateTag(CACHE_TAGS.GAMES)

    return { success: true }
  } catch (error) {
    console.error('Game creation error:', error)
    return {
      success: false,
      error: 'ゲームの作成に失敗しました'
    }
  }
}

export async function updateGame(gameId: string, formData: FormData) {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  // 所有者チェック
  const [game] = await executeQuery<any[]>(
    'SELECT created_by FROM games WHERE id = ?',
    [gameId]
  )

  if (!game || game.created_by !== session.user.id) {
    throw new Error('Forbidden')
  }

  const rawData = {
    teamName: formData.get('teamName') as string,
    date: formData.get('date') as string,
    time: formData.get('time') as string,
    location: formData.get('location') as string,
    participants: parseInt(formData.get('participants') as string),
    description: formData.get('description') as string
  }

  const validation = gameSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message
    }
  }

  try {
    await executeQuery(
      `UPDATE games 
       SET team_name = ?, date = ?, time = ?, location = ?, participants = ?, description = ? 
       WHERE id = ?`,
      [
        validation.data.teamName,
        validation.data.date,
        validation.data.time,
        validation.data.location,
        validation.data.participants,
        validation.data.description || null,
        gameId
      ]
    )

    // キャッシュを無効化
    revalidateTag(CACHE_TAGS.GAMES)

    return { success: true }
  } catch (error) {
    console.error('Game update error:', error)
    return {
      success: false,
      error: 'ゲームの更新に失敗しました'
    }
  }
}

export async function deleteGame(gameId: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  // 所有者チェック
  const [game] = await executeQuery<any[]>(
    'SELECT created_by FROM games WHERE id = ?',
    [gameId]
  )

  if (!game || game.created_by !== session.user.id) {
    throw new Error('Forbidden')
  }

  try {
    await executeQuery('DELETE FROM games WHERE id = ?', [gameId])

    // キャッシュを無効化
    revalidateTag(CACHE_TAGS.GAMES)

    return { success: true }
  } catch (error) {
    console.error('Game deletion error:', error)
    return {
      success: false,
      error: 'ゲームの削除に失敗しました'
    }
  }
}

export async function applyForGame(gameId: string, message?: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  try {
    // 重複申請チェック
    const existing = await executeQuery(
      'SELECT id FROM applications WHERE game_id = ? AND applicant_id = ?',
      [gameId, session.user.id]
    )

    if ((existing as any[]).length > 0) {
      return {
        success: false,
        error: '既に申請済みです'
      }
    }

    await executeQuery(
      `INSERT INTO applications (game_id, applicant_id, message, status) 
       VALUES (?, ?, ?, 'pending')`,
      [gameId, session.user.id, message || null]
    )

    // キャッシュを無効化
    revalidateTag(CACHE_TAGS.APPLICATIONS)

    return { success: true }
  } catch (error) {
    console.error('Application error:', error)
    return {
      success: false,
      error: '申請に失敗しました'
    }
  }
}
```

### 6.2.2: Optimistic Updates の実装

**ファイル**: `components/forms/GameForm.tsx`
```tsx
'use client'

import { useState, useOptimistic } from 'react'
import { createGame } from '@/app/actions/games'

interface Game {
  id: string
  teamName: string
  date: string
  time: string
  location: string
  participants: number
  description?: string
}

interface GameFormProps {
  onSuccess?: () => void
}

export default function GameForm({ onSuccess }: GameFormProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (formData: FormData) => {
    setPending(true)
    setError('')

    try {
      const result = await createGame(formData)
      
      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'エラーが発生しました')
      }
    } catch (err) {
      setError('エラーが発生しました')
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="label">チーム名</label>
        <input
          name="teamName"
          type="text"
          required
          className="input"
          disabled={pending}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">日付</label>
          <input
            name="date"
            type="date"
            required
            className="input"
            disabled={pending}
          />
        </div>
        <div>
          <label className="label">時間</label>
          <input
            name="time"
            type="time"
            required
            className="input"
            disabled={pending}
          />
        </div>
      </div>
      
      <div>
        <label className="label">場所</label>
        <input
          name="location"
          type="text"
          required
          className="input"
          disabled={pending}
        />
      </div>
      
      <div>
        <label className="label">参加人数</label>
        <input
          name="participants"
          type="number"
          min="1"
          required
          className="input"
          disabled={pending}
        />
      </div>
      
      <div>
        <label className="label">説明（任意）</label>
        <textarea
          name="description"
          rows={3}
          className="input"
          disabled={pending}
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full"
      >
        {pending ? '作成中...' : '試合を作成'}
      </button>
    </form>
  )
}
```

**ファイル**: `components/GameList.tsx` (Optimistic Updates対応)
```tsx
'use client'

import { useState, useOptimistic } from 'react'
import { Game } from '@/lib/data/games'
import { applyForGame } from '@/app/actions/games'
import GameCard from './GameCard'

interface GameListProps {
  games: Game[]
}

export default function GameList({ games }: GameListProps) {
  const [optimisticGames, addOptimisticApplication] = useOptimistic(
    games,
    (state, gameId: string) => {
      return state.map(game => 
        game.id === gameId 
          ? { ...game, hasApplied: true }
          : game
      )
    }
  )

  const handleApply = async (gameId: string) => {
    // Optimistic Update
    addOptimisticApplication(gameId)
    
    try {
      const result = await applyForGame(gameId)
      if (!result.success) {
        // エラー時の処理（実際のUIでは元に戻す）
        console.error(result.error)
      }
    } catch (error) {
      console.error('Application failed:', error)
    }
  }

  if (optimisticGames.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        現在、登録されている試合はありません
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {optimisticGames.map((game) => (
        <GameCard 
          key={game.id} 
          game={game} 
          onApply={handleApply}
        />
      ))}
    </div>
  )
}
```

## 📝 確認事項

### データフェッチング最適化チェックリスト

- [ ] Server Components でのデータフェッチが実装されている
- [ ] キャッシング戦略が適切に設定されている
- [ ] Server Actions が実装されている
- [ ] Optimistic Updates が実装されている
- [ ] エラーハンドリングが適切に行われている
- [ ] Loading 状態が実装されている
- [ ] キャッシュの無効化が適切に行われている

### パフォーマンス確認

1. **初回ロード時間**
   - Server Components による高速な初期レンダリング
   - データの並列フェッチ

2. **キャッシュ効果**
   - 同一データの重複取得を避ける
   - 適切なキャッシュ期間の設定

3. **ユーザー体験**
   - Optimistic Updates による即座の反応
   - Loading 状態の適切な表示

## ⚠️ 注意事項

1. **キャッシュ戦略**
   - 過度なキャッシュは古いデータを表示する可能性
   - リアルタイム性が重要なデータは短いキャッシュ期間

2. **Optimistic Updates**
   - エラー時の適切なロールバック処理
   - ネットワークエラーへの対応

3. **メモリリーク**
   - 長時間のキャッシュはメモリ使用量増加
   - 適切なキャッシュクリア戦略

## 🔄 次のステップ

Phase 6 が完了したら、[Phase 7: パフォーマンス最適化](./07-phase7-performance.md) へ進みます。

## 📚 参考資料

- [Data Fetching in App Router](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Caching in Next.js](https://nextjs.org/docs/app/building-your-application/caching)
- [Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [useOptimistic Hook](https://react.dev/reference/react/useOptimistic)

---

*最終更新: 2025-09-09*