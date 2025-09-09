import { NextRequest } from 'next/server'
import { requireAuth, ApiResponse, checkHttpMethod } from '@/lib/api-auth'
import { 
  getMatchesByUser,
  getHostMatchesByUser,
  getGuestMatchesByUser,
  getUpcomingMatches,
  getPastMatches
} from '@/lib/db/matches'

// GET /api/matches - マッチ一覧取得
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'all', 'host', 'guest', 'upcoming', 'past'

    let matches

    switch (type) {
      case 'host':
        matches = await getHostMatchesByUser(user.id)
        break
      case 'guest':
        matches = await getGuestMatchesByUser(user.id)
        break
      case 'upcoming':
        matches = await getUpcomingMatches(user.id)
        break
      case 'past':
        matches = await getPastMatches(user.id)
        break
      default:
        matches = await getMatchesByUser(user.id)
    }

    // マッチにユーザーの役割を追加
    const matchesWithRole = matches.map(match => ({
      ...match,
      userRole: match.host_id === user.id ? 'host' : 'guest',
      isHost: match.host_id === user.id,
      isGuest: match.guest_id === user.id
    }))

    // 日付でグループ化
    const groupedMatches = matchesWithRole.reduce((groups, match) => {
      const date = match.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(match)
      return groups
    }, {} as Record<string, typeof matchesWithRole>)

    return ApiResponse.success({
      type: type || 'all',
      count: matches.length,
      matches: matchesWithRole,
      groupedByDate: groupedMatches,
      summary: {
        total: matches.length,
        asHost: matches.filter(m => m.host_id === user.id).length,
        asGuest: matches.filter(m => m.guest_id === user.id).length,
        upcoming: matches.filter(m => new Date(m.date) >= new Date()).length,
        past: matches.filter(m => new Date(m.date) < new Date()).length
      }
    })
  } catch (error) {
    console.error('マッチ取得エラー:', error)
    return ApiResponse.serverError('マッチの取得に失敗しました')
  }
}