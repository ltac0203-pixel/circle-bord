import { NextRequest } from 'next/server'
import { ApiResponse, checkHttpMethod } from '@/lib/api-auth'
import { searchGames } from '@/lib/db/games'

// GET /api/games/search - ゲーム検索
export async function GET(req: NextRequest) {
  const methodCheck = checkHttpMethod(req, ['GET'])
  if (!methodCheck.success) {
    return ApiResponse.error(methodCheck.error, 405)
  }

  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('q')

    if (!keyword || keyword.trim().length === 0) {
      return ApiResponse.error('検索キーワードを入力してください')
    }

    if (keyword.trim().length < 2) {
      return ApiResponse.error('検索キーワードは2文字以上で入力してください')
    }

    const games = await searchGames(keyword.trim())

    return ApiResponse.success({
      keyword: keyword.trim(),
      count: games.length,
      games
    })
  } catch (error) {
    console.error('ゲーム検索エラー:', error)
    return ApiResponse.serverError('ゲームの検索に失敗しました')
  }
}