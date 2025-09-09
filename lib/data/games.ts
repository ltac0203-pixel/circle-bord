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