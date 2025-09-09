import { getConnection, executeQuery } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'

export interface UserRecord {
  id: string
  name: string
  email: string
  password: string
  team_name?: string
  created_at: Date
  updated_at: Date
}

// ユーザーの作成
export async function createUser(
  name: string,
  email: string,
  password: string,
  teamName?: string
): Promise<UserRecord | null> {
  const connection = await getConnection()
  
  try {
    const hashedPassword = await hashPassword(password)
    
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, team_name) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, teamName || null]
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
    connection.release()
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
    connection.release()
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