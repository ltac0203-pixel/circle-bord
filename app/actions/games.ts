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
      error: validation.error.issues[0].message
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
      error: validation.error.issues[0].message
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