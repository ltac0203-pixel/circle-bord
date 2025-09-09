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