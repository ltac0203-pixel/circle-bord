import { getConnection, executeQuery } from '@/lib/db'

export interface MatchRecord {
  id: string
  game_id: string
  application_id: string
  host_team_name: string
  guest_team_name: string
  host_contact: string
  guest_contact: string
  host_id: string
  guest_id: string
  sport: string
  date: string
  time: string
  location: string
  description?: string
  matched_at: Date
  created_at: Date
}

export interface CreateMatchInput {
  game_id: string
  application_id: string
  host_team_name: string
  guest_team_name: string
  host_contact: string
  guest_contact: string
  host_id: string
  guest_id: string
  sport: string
  date: string
  time: string
  location: string
  description?: string
}

// ユーザーの試合を取得（ホスト側・ゲスト側両方）
export async function getMatchesByUser(userId: string): Promise<MatchRecord[]> {
  try {
    const results = await executeQuery<MatchRecord[]>(
      `SELECT * FROM matches 
       WHERE host_id = ? OR guest_id = ?
       ORDER BY date ASC, time ASC`,
      [userId, userId]
    )
    return results || []
  } catch (error) {
    console.error('ユーザー試合取得エラー:', error)
    return []
  }
}

// ユーザーがホストする試合を取得
export async function getHostMatchesByUser(userId: string): Promise<MatchRecord[]> {
  try {
    const results = await executeQuery<MatchRecord[]>(
      'SELECT * FROM matches WHERE host_id = ? ORDER BY date ASC, time ASC',
      [userId]
    )
    return results || []
  } catch (error) {
    console.error('ホスト試合取得エラー:', error)
    return []
  }
}

// ユーザーがゲストとして参加する試合を取得
export async function getGuestMatchesByUser(userId: string): Promise<MatchRecord[]> {
  try {
    const results = await executeQuery<MatchRecord[]>(
      'SELECT * FROM matches WHERE guest_id = ? ORDER BY date ASC, time ASC',
      [userId]
    )
    return results || []
  } catch (error) {
    console.error('ゲスト試合取得エラー:', error)
    return []
  }
}

// IDで試合を取得
export async function getMatchById(id: string): Promise<MatchRecord | null> {
  try {
    const results = await executeQuery<MatchRecord[]>(
      'SELECT * FROM matches WHERE id = ?',
      [id]
    )
    return results && results.length > 0 ? results[0] : null
  } catch (error) {
    console.error('試合詳細取得エラー:', error)
    return null
  }
}

// ゲームIDで試合を取得
export async function getMatchByGameId(gameId: string): Promise<MatchRecord | null> {
  try {
    const results = await executeQuery<MatchRecord[]>(
      'SELECT * FROM matches WHERE game_id = ?',
      [gameId]
    )
    return results && results.length > 0 ? results[0] : null
  } catch (error) {
    console.error('ゲーム試合取得エラー:', error)
    return null
  }
}

// 新しい試合を作成
export async function createMatch(matchData: CreateMatchInput): Promise<MatchRecord | null> {
  const connection = await getConnection()
  
  try {
    await connection.beginTransaction()
    
    // 重複チェック
    const [existingRows] = await connection.execute(
      'SELECT id FROM matches WHERE game_id = ?',
      [matchData.game_id]
    )
    
    if (Array.isArray(existingRows) && existingRows.length > 0) {
      throw new Error('この募集は既にマッチング済みです')
    }
    
    // 試合を作成
    const [result] = await connection.execute(
      `INSERT INTO matches (
        game_id, application_id, host_team_name, guest_team_name, 
        host_contact, guest_contact, host_id, guest_id, 
        sport, date, time, location, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        matchData.game_id,
        matchData.application_id,
        matchData.host_team_name,
        matchData.guest_team_name,
        matchData.host_contact,
        matchData.guest_contact,
        matchData.host_id,
        matchData.guest_id,
        matchData.sport,
        matchData.date,
        matchData.time,
        matchData.location,
        matchData.description || null
      ]
    )
    
    const matchId = (result as any).insertId
    
    // ゲームステータスを'matched'に更新
    await connection.execute(
      'UPDATE games SET status = ? WHERE id = ?',
      ['matched', matchData.game_id]
    )
    
    // 申請ステータスを'approved'に更新
    await connection.execute(
      'UPDATE applications SET status = ? WHERE id = ?',
      ['approved', matchData.application_id]
    )
    
    // 同じゲームの他の申請を'rejected'に更新
    await connection.execute(
      'UPDATE applications SET status = ? WHERE game_id = ? AND id != ?',
      ['rejected', matchData.game_id, matchData.application_id]
    )
    
    await connection.commit()
    
    const [rows] = await connection.execute(
      'SELECT * FROM matches WHERE id = ?',
      [matchId]
    )
    
    return (rows as MatchRecord[])[0]
  } catch (error) {
    await connection.rollback()
    console.error('試合作成エラー:', error)
    return null
  } finally {
    await connection.end()
  }
}

// 試合をキャンセル
export async function cancelMatch(id: string, userId: string): Promise<boolean> {
  const connection = await getConnection()
  
  try {
    await connection.beginTransaction()
    
    // 試合の詳細を取得
    const [matchRows] = await connection.execute(
      'SELECT * FROM matches WHERE id = ? AND (host_id = ? OR guest_id = ?)',
      [id, userId, userId]
    )
    
    if (!Array.isArray(matchRows) || matchRows.length === 0) {
      throw new Error('権限がありません')
    }
    
    const match = matchRows[0] as MatchRecord
    
    // 試合を削除
    await connection.execute('DELETE FROM matches WHERE id = ?', [id])
    
    // ゲームステータスを'open'に戻す
    await connection.execute(
      'UPDATE games SET status = ? WHERE id = ?',
      ['open', match.game_id]
    )
    
    // 申請ステータスを'pending'に戻す
    await connection.execute(
      'UPDATE applications SET status = ? WHERE id = ?',
      ['pending', match.application_id]
    )
    
    // 他の申請も'pending'に戻す
    await connection.execute(
      'UPDATE applications SET status = ? WHERE game_id = ? AND status = ?',
      ['pending', match.game_id, 'rejected']
    )
    
    await connection.commit()
    return true
  } catch (error) {
    await connection.rollback()
    console.error('試合キャンセルエラー:', error)
    return false
  } finally {
    await connection.end()
  }
}

// 今後の試合を取得
export async function getUpcomingMatches(userId: string): Promise<MatchRecord[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const results = await executeQuery<MatchRecord[]>(
      `SELECT * FROM matches 
       WHERE (host_id = ? OR guest_id = ?) AND date >= ?
       ORDER BY date ASC, time ASC`,
      [userId, userId, today]
    )
    return results || []
  } catch (error) {
    console.error('今後の試合取得エラー:', error)
    return []
  }
}

// 過去の試合を取得
export async function getPastMatches(userId: string): Promise<MatchRecord[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const results = await executeQuery<MatchRecord[]>(
      `SELECT * FROM matches 
       WHERE (host_id = ? OR guest_id = ?) AND date < ?
       ORDER BY date DESC, time DESC`,
      [userId, userId, today]
    )
    return results || []
  } catch (error) {
    console.error('過去の試合取得エラー:', error)
    return []
  }
}