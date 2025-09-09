import { NextRequest } from 'next/server'
import { getAuthUser, requireAuth, ApiResponse, parseRequestBody, checkHttpMethod, checkUserPermission } from '@/lib/api-auth'
import { 
  getGameById, 
  updateGameStatus, 
  deleteGame 
} from '@/lib/db/games'
import { z } from 'zod'

// バリデーションスキーマ
const updateGameSchema = z.object({
  status: z.string()
})

// GET /api/games/[id] - 特定のゲーム詳細取得
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const methodCheck = checkHttpMethod(req, ['GET'])
  if (!methodCheck.success) {
    return ApiResponse.error(methodCheck.error, 405)
  }

  try {
    const { id: gameId } = await params

    if (!gameId) {
      return ApiResponse.error('ゲームIDが指定されていません')
    }

    const game = await getGameById(gameId)

    if (!game) {
      return ApiResponse.notFound('指定されたゲームが見つかりません')
    }

    return ApiResponse.success(game)
  } catch (error) {
    console.error('ゲーム詳細取得エラー:', error)
    return ApiResponse.serverError('ゲーム詳細の取得に失敗しました')
  }
}

// PUT /api/games/[id] - ゲーム更新（主にステータス更新）
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const methodCheck = checkHttpMethod(req, ['PUT'])
  if (!methodCheck.success) {
    return ApiResponse.error(methodCheck.error, 405)
  }

  try {
    const authResult = await requireAuth()
    if (authResult instanceof Response) {
      return authResult
    }
    const user = authResult

    const { id: gameId } = await params

    if (!gameId) {
      return ApiResponse.error('ゲームIDが指定されていません')
    }

    // ゲームの存在確認と権限チェック
    const existingGame = await getGameById(gameId)
    if (!existingGame) {
      return ApiResponse.notFound('指定されたゲームが見つかりません')
    }

    if (!checkUserPermission(existingGame.owner_id, user.id)) {
      return ApiResponse.forbidden('このゲームを編集する権限がありません')
    }

    const bodyResult = await parseRequestBody(req, ['status'])
    if (!bodyResult.success) {
      return ApiResponse.error(bodyResult.error, 400)
    }

    // Zodでバリデーション
    const validation = updateGameSchema.safeParse(bodyResult.data)
    if (!validation.success) {
      return ApiResponse.error(
        validation.error.issues[0].message,
        400,
        validation.error.issues
      )
    }

    const { status } = validation.data

    // ステータス値の検証
    if (!['open', 'matched'].includes(status)) {
      return ApiResponse.error('ステータスはopenまたはmatchedを指定してください')
    }

    const success = await updateGameStatus(gameId, status as 'open' | 'matched', user.id)

    if (!success) {
      return ApiResponse.error('ゲームの更新に失敗しました')
    }

    // 更新後のゲーム情報を取得
    const updatedGame = await getGameById(gameId)

    return ApiResponse.success(updatedGame)
  } catch (error) {
    console.error('ゲーム更新エラー:', error)
    return ApiResponse.serverError('ゲームの更新に失敗しました')
  }
}

// DELETE /api/games/[id] - ゲーム削除
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

    const { id: gameId } = await params

    if (!gameId) {
      return ApiResponse.error('ゲームIDが指定されていません')
    }

    // ゲームの存在確認と権限チェック
    const existingGame = await getGameById(gameId)
    if (!existingGame) {
      return ApiResponse.notFound('指定されたゲームが見つかりません')
    }

    if (!checkUserPermission(existingGame.owner_id, user.id)) {
      return ApiResponse.forbidden('このゲームを削除する権限がありません')
    }

    // マッチング済みのゲームは削除できない
    if (existingGame.status === 'matched') {
      return ApiResponse.error('マッチング済みのゲームは削除できません')
    }

    const success = await deleteGame(gameId, user.id)

    if (!success) {
      return ApiResponse.error('ゲームの削除に失敗しました')
    }

    return ApiResponse.success({ 
      message: 'ゲームが正常に削除されました',
      deletedGameId: gameId
    })
  } catch (error) {
    console.error('ゲーム削除エラー:', error)
    return ApiResponse.serverError('ゲームの削除に失敗しました')
  }
}