import { NextRequest } from 'next/server'
import { requireAuth, ApiResponse, checkHttpMethod } from '@/lib/api-auth'
import { 
  getMatchById, 
  cancelMatch 
} from '@/lib/db/matches'

// GET /api/matches/[id] - 特定のマッチ詳細取得
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const methodCheck = checkHttpMethod(req, ['GET'])
  if (!methodCheck.success) {
    return ApiResponse.error(methodCheck.error, 405)
  }

  try {
    const authResult = await requireAuth()
    if (authResult instanceof Response) {
      return authResult
    }
    const user = authResult

    const { id: matchId } = await params

    if (!matchId) {
      return ApiResponse.error('マッチIDが指定されていません')
    }

    const match = await getMatchById(matchId)

    if (!match) {
      return ApiResponse.notFound('指定されたマッチが見つかりません')
    }

    // マッチの参加者のみアクセス可能
    if (match.host_id !== user.id && match.guest_id !== user.id) {
      return ApiResponse.forbidden('このマッチにアクセスする権限がありません')
    }

    // ユーザーの役割を追加
    const matchWithRole = {
      ...match,
      userRole: match.host_id === user.id ? 'host' : 'guest',
      isHost: match.host_id === user.id,
      isGuest: match.guest_id === user.id,
      opponent: {
        teamName: match.host_id === user.id ? match.guest_team_name : match.host_team_name,
        contact: match.host_id === user.id ? match.guest_contact : match.host_contact,
        id: match.host_id === user.id ? match.guest_id : match.host_id
      }
    }

    // 試合までの日数を計算
    const matchDate = new Date(match.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    matchDate.setHours(0, 0, 0, 0)
    const daysUntilMatch = Math.ceil((matchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return ApiResponse.success({
      match: matchWithRole,
      daysUntilMatch,
      isPast: daysUntilMatch < 0,
      isToday: daysUntilMatch === 0,
      isFuture: daysUntilMatch > 0
    })
  } catch (error) {
    console.error('マッチ詳細取得エラー:', error)
    return ApiResponse.serverError('マッチ詳細の取得に失敗しました')
  }
}

// DELETE /api/matches/[id] - マッチキャンセル
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const methodCheck = checkHttpMethod(req, ['DELETE'])
  if (!methodCheck.success) {
    return ApiResponse.error(methodCheck.error, 405)
  }

  try {
    const authResult = await requireAuth()
    if (authResult instanceof Response) {
      return authResult
    }
    const user = authResult

    const { id: matchId } = await params

    if (!matchId) {
      return ApiResponse.error('マッチIDが指定されていません')
    }

    // マッチの存在確認
    const match = await getMatchById(matchId)
    if (!match) {
      return ApiResponse.notFound('指定されたマッチが見つかりません')
    }

    // マッチの参加者のみがキャンセル可能
    if (match.host_id !== user.id && match.guest_id !== user.id) {
      return ApiResponse.forbidden('このマッチをキャンセルする権限がありません')
    }

    // 過去のマッチはキャンセルできない
    const matchDate = new Date(match.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    matchDate.setHours(0, 0, 0, 0)

    if (matchDate < today) {
      return ApiResponse.error('過去のマッチはキャンセルできません')
    }

    // マッチ当日はキャンセルできない（オプション）
    if (matchDate.getTime() === today.getTime()) {
      return ApiResponse.error('当日のマッチはキャンセルできません')
    }

    const success = await cancelMatch(matchId, user.id)

    if (!success) {
      return ApiResponse.error('マッチのキャンセルに失敗しました')
    }

    const userRole = match.host_id === user.id ? 'host' : 'guest'
    const opponentTeam = match.host_id === user.id ? match.guest_team_name : match.host_team_name

    return ApiResponse.success({
      message: 'マッチが正常にキャンセルされました',
      cancelledMatchId: matchId,
      details: {
        userRole,
        opponentTeam,
        originalDate: match.date,
        originalTime: match.time,
        location: match.location
      }
    })
  } catch (error) {
    console.error('マッチキャンセルエラー:', error)
    return ApiResponse.serverError('マッチのキャンセルに失敗しました')
  }
}