import { getConnection, executeQuery } from '@/lib/db'

export interface GameRecord {
  id: string
  team_name: string
  sport: string
  date: string
  time: string
  location: string
  contact: string
  description?: string
  status: 'open' | 'matched'
  owner_id: string
  created_at: Date
  updated_at: Date
}

export interface CreateGameInput {
  team_name: string
  sport: string
  date: string
  time: string
  location: string
  contact: string
  description?: string
  owner_id: string
}

// 全ての募集中のゲームを取得
export async function getAllOpenGames(): Promise<GameRecord[]> {
  try {
    const results = await executeQuery<GameRecord[]>(
      'SELECT * FROM games WHERE status = ? ORDER BY date ASC, time ASC',
      ['open']
    )
    return results || []
  } catch (error) {
    console.error('ゲーム取得エラー:', error)
    return []
  }
}

// スポーツでフィルタしたゲームを取得
export async function getGamesBySport(sport: string): Promise<GameRecord[]> {
  try {
    const results = await executeQuery<GameRecord[]>(
      'SELECT * FROM games WHERE status = ? AND sport = ? ORDER BY date ASC, time ASC',
      ['open', sport]
    )
    return results || []
  } catch (error) {
    console.error('スポーツ別ゲーム取得エラー:', error)
    return []
  }
}

// ユーザーのゲームを取得
export async function getGamesByUser(userId: string): Promise<GameRecord[]> {
  try {
    const results = await executeQuery<GameRecord[]>(
      'SELECT * FROM games WHERE owner_id = ? ORDER BY created_at DESC',
      [userId]
    )
    return results || []
  } catch (error) {
    console.error('ユーザーゲーム取得エラー:', error)
    return []
  }
}

// IDでゲームを取得
export async function getGameById(id: string): Promise<GameRecord | null> {
  try {
    const results = await executeQuery<GameRecord[]>(
      'SELECT * FROM games WHERE id = ?',
      [id]
    )
    return results && results.length > 0 ? results[0] : null
  } catch (error) {
    console.error('ゲーム詳細取得エラー:', error)
    return null
  }
}

// 新しいゲームを作成
export async function createGame(gameData: CreateGameInput): Promise<GameRecord | null> {
  const connection = await getConnection()
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO games (team_name, sport, date, time, location, contact, description, owner_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        gameData.team_name,
        gameData.sport,
        gameData.date,
        gameData.time,
        gameData.location,
        gameData.contact,
        gameData.description || null,
        gameData.owner_id
      ]
    )
    
    const gameId = (result as any).insertId
    
    const [rows] = await connection.execute(
      'SELECT * FROM games WHERE id = ?',
      [gameId]
    )
    
    return (rows as GameRecord[])[0]
  } catch (error) {
    console.error('ゲーム作成エラー:', error)
    return null
  } finally {
    await connection.end()
  }
}

// ゲームステータスを更新
export async function updateGameStatus(
  id: string, 
  status: 'open' | 'matched',
  ownerId: string
): Promise<boolean> {
  try {
    const result = await executeQuery(
      'UPDATE games SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_id = ?',
      [status, id, ownerId]
    )
    return (result as any).affectedRows > 0
  } catch (error) {
    console.error('ゲームステータス更新エラー:', error)
    return false
  }
}

// ゲームを削除
export async function deleteGame(id: string, ownerId: string): Promise<boolean> {
  try {
    const result = await executeQuery(
      'DELETE FROM games WHERE id = ? AND owner_id = ?',
      [id, ownerId]
    )
    return (result as any).affectedRows > 0
  } catch (error) {
    console.error('ゲーム削除エラー:', error)
    return false
  }
}

// ゲーム一覧を検索（キーワード検索）
export async function searchGames(keyword: string): Promise<GameRecord[]> {
  try {
    const searchTerm = `%${keyword}%`
    const results = await executeQuery<GameRecord[]>(
      `SELECT * FROM games 
       WHERE status = 'open' 
       AND (team_name LIKE ? OR sport LIKE ? OR location LIKE ? OR description LIKE ?)
       ORDER BY date ASC, time ASC`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    )
    return results || []
  } catch (error) {
    console.error('ゲーム検索エラー:', error)
    return []
  }
}