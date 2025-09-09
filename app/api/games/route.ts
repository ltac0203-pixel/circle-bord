import { NextRequest } from 'next/server'
import { getAuthUser, requireAuth, ApiResponse, parseRequestBody, checkHttpMethod } from '@/lib/api-auth'
import { 
  getAllOpenGames, 
  getGamesBySport, 
  getGamesByUser, 
  createGame,
  CreateGameInput 
} from '@/lib/db/games'
import { z } from 'zod'

// バリデーションスキーマ
const createGameSchema = z.object({
  team_name: z.string().min(1, 'チーム名を入力してください'),
  sport: z.string().min(1, 'スポーツ種目を選択してください'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '有効な日付を入力してください'),
  time: z.string().regex(/^\d{2}:\d{2}$/, '有効な時間を入力してください'),
  location: z.string().min(1, '場所を入力してください'),
  contact: z.string().min(1, '連絡先を入力してください'),
  description: z.string().optional()
})

// GET /api/games - ゲーム一覧取得
export async function GET(req: NextRequest) {
  const methodCheck = checkHttpMethod(req, ['GET'])
  if (!methodCheck.success) {
    return ApiResponse.error(methodCheck.error, 405)
  }

  try {
    const user = await getAuthUser() // オプショナル認証
    const { searchParams } = new URL(req.url)
    const sport = searchParams.get('sport')
    const userId = searchParams.get('userId')

    let games

    if (userId && user?.id === userId) {
      // ユーザー自身のゲームを取得
      games = await getGamesByUser(userId)
    } else if (sport && sport !== 'all') {
      // スポーツでフィルタ
      games = await getGamesBySport(sport)
    } else {
      // 全ての募集中ゲームを取得
      games = await getAllOpenGames()
    }

    return ApiResponse.success(games)
  } catch (error) {
    console.error('ゲーム取得エラー:', error)
    return ApiResponse.serverError('ゲームの取得に失敗しました')
  }
}

// POST /api/games - 新しいゲーム作成
export async function POST(req: NextRequest) {
  const methodCheck = checkHttpMethod(req, ['POST'])
  if (!methodCheck.success) {
    return ApiResponse.error(methodCheck.error, 405)
  }

  try {
    const authResult = await requireAuth()
    if (authResult instanceof Response) {
      return authResult
    }
    const user = authResult

    const bodyResult = await parseRequestBody<CreateGameInput>(req, [
      'team_name', 'sport', 'date', 'time', 'location', 'contact'
    ])

    if (!bodyResult.success) {
      return ApiResponse.error(bodyResult.error, 400)
    }

    // Zodでバリデーション
    const validation = createGameSchema.safeParse(bodyResult.data)
    if (!validation.success) {
      return ApiResponse.error(
        validation.error.issues[0].message,
        400,
        validation.error.issues
      )
    }

    const gameData: CreateGameInput = {
      ...validation.data,
      owner_id: user.id
    }

    // 日付が過去でないかチェック
    const gameDate = new Date(gameData.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (gameDate < today) {
      return ApiResponse.error('過去の日付は選択できません')
    }

    const newGame = await createGame(gameData)

    if (!newGame) {
      return ApiResponse.error('ゲームの作成に失敗しました')
    }

    return ApiResponse.success(newGame, 201)
  } catch (error) {
    console.error('ゲーム作成エラー:', error)
    return ApiResponse.serverError('ゲームの作成に失敗しました')
  }
}