import { getConnection, executeQuery } from '@/lib/db'

export interface ApplicationRecord {
  id: string
  game_id: string
  applicant_team_name: string
  applicant_contact: string
  applicant_id: string
  status: 'pending' | 'approved' | 'rejected'
  message?: string
  applied_at: Date
  updated_at: Date
}

export interface CreateApplicationInput {
  game_id: string
  applicant_team_name: string
  applicant_contact: string
  applicant_id: string
  message?: string
}

export interface ApplicationWithGameInfo extends ApplicationRecord {
  game_team_name: string
  game_sport: string
  game_date: string
  game_time: string
  game_location: string
}

// 特定のゲームへの申請を取得
export async function getApplicationsByGame(gameId: string): Promise<ApplicationRecord[]> {
  try {
    const results = await executeQuery<ApplicationRecord[]>(
      'SELECT * FROM applications WHERE game_id = ? ORDER BY applied_at ASC',
      [gameId]
    )
    return results || []
  } catch (error) {
    console.error('ゲーム申請取得エラー:', error)
    return []
  }
}

// ユーザーが送信した申請を取得
export async function getApplicationsByUser(userId: string): Promise<ApplicationWithGameInfo[]> {
  try {
    const results = await executeQuery<ApplicationWithGameInfo[]>(
      `SELECT a.*, g.team_name as game_team_name, g.sport as game_sport, 
              g.date as game_date, g.time as game_time, g.location as game_location
       FROM applications a
       JOIN games g ON a.game_id = g.id
       WHERE a.applicant_id = ?
       ORDER BY a.applied_at DESC`,
      [userId]
    )
    return results || []
  } catch (error) {
    console.error('ユーザー申請取得エラー:', error)
    return []
  }
}

// ユーザーが受け取った申請を取得（ゲームオーナー向け）
export async function getReceivedApplicationsByUser(userId: string): Promise<ApplicationWithGameInfo[]> {
  try {
    const results = await executeQuery<ApplicationWithGameInfo[]>(
      `SELECT a.*, g.team_name as game_team_name, g.sport as game_sport,
              g.date as game_date, g.time as game_time, g.location as game_location
       FROM applications a
       JOIN games g ON a.game_id = g.id
       WHERE g.owner_id = ?
       ORDER BY a.applied_at DESC`,
      [userId]
    )
    return results || []
  } catch (error) {
    console.error('受信申請取得エラー:', error)
    return []
  }
}

// IDで申請を取得
export async function getApplicationById(id: string): Promise<ApplicationRecord | null> {
  try {
    const results = await executeQuery<ApplicationRecord[]>(
      'SELECT * FROM applications WHERE id = ?',
      [id]
    )
    return results && results.length > 0 ? results[0] : null
  } catch (error) {
    console.error('申請詳細取得エラー:', error)
    return null
  }
}

// 新しい申請を作成
export async function createApplication(applicationData: CreateApplicationInput): Promise<ApplicationRecord | null> {
  const connection = await getConnection()
  
  try {
    // 重複申請チェック
    const [existingRows] = await connection.execute(
      'SELECT id FROM applications WHERE game_id = ? AND applicant_id = ?',
      [applicationData.game_id, applicationData.applicant_id]
    )
    
    if (Array.isArray(existingRows) && existingRows.length > 0) {
      throw new Error('既にこのゲームに申請済みです')
    }
    
    const [result] = await connection.execute(
      `INSERT INTO applications (game_id, applicant_team_name, applicant_contact, applicant_id, message) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        applicationData.game_id,
        applicationData.applicant_team_name,
        applicationData.applicant_contact,
        applicationData.applicant_id,
        applicationData.message || null
      ]
    )
    
    const applicationId = (result as any).insertId
    
    const [rows] = await connection.execute(
      'SELECT * FROM applications WHERE id = ?',
      [applicationId]
    )
    
    return (rows as ApplicationRecord[])[0]
  } catch (error) {
    console.error('申請作成エラー:', error)
    return null
  } finally {
    await connection.end()
  }
}

// 申請ステータスを更新
export async function updateApplicationStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  gameOwnerId: string
): Promise<boolean> {
  const connection = await getConnection()
  
  try {
    // ゲームオーナーの権限確認
    const [gameRows] = await connection.execute(
      `SELECT g.id FROM games g 
       JOIN applications a ON g.id = a.game_id 
       WHERE a.id = ? AND g.owner_id = ?`,
      [id, gameOwnerId]
    )
    
    if (!Array.isArray(gameRows) || gameRows.length === 0) {
      throw new Error('権限がありません')
    }
    
    const [result] = await connection.execute(
      'UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    )
    
    return (result as any).affectedRows > 0
  } catch (error) {
    console.error('申請ステータス更新エラー:', error)
    return false
  } finally {
    await connection.end()
  }
}

// 申請を削除
export async function deleteApplication(id: string, applicantId: string): Promise<boolean> {
  try {
    const result = await executeQuery(
      'DELETE FROM applications WHERE id = ? AND applicant_id = ? AND status = ?',
      [id, applicantId, 'pending']
    )
    return (result as any).affectedRows > 0
  } catch (error) {
    console.error('申請削除エラー:', error)
    return false
  }
}

// ゲームIDとユーザーIDで申請をチェック
export async function checkExistingApplication(
  gameId: string, 
  applicantId: string
): Promise<ApplicationRecord | null> {
  try {
    const results = await executeQuery<ApplicationRecord[]>(
      'SELECT * FROM applications WHERE game_id = ? AND applicant_id = ?',
      [gameId, applicantId]
    )
    return results && results.length > 0 ? results[0] : null
  } catch (error) {
    console.error('申請確認エラー:', error)
    return null
  }
}