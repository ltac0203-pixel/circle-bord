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