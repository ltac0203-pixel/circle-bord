import { NextRequest } from 'next/server'
import { requireAuth, ApiResponse, parseRequestBody, checkHttpMethod } from '@/lib/api-auth'
import { 
  getApplicationById, 
  updateApplicationStatus, 
  deleteApplication 
} from '@/lib/db/applications'
import { getGameById } from '@/lib/db/games'
import { createMatch, CreateMatchInput } from '@/lib/db/matches'
import { z } from 'zod'

// バリデーションスキーマ
const updateApplicationSchema = z.object({
  status: z.string()
})

// GET /api/applications/[id] - 特定の申請詳細取得
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

    const { id: applicationId } = await params

    if (!applicationId) {
      return ApiResponse.error('申請IDが指定されていません')
    }

    const application = await getApplicationById(applicationId)

    if (!application) {
      return ApiResponse.notFound('指定された申請が見つかりません')
    }

    // ゲーム情報も取得
    const game = await getGameById(application.game_id)
    
    // 申請者または募集者のみアクセス可能
    if (application.applicant_id !== user.id && game?.owner_id !== user.id) {
      return ApiResponse.forbidden('この申請にアクセスする権限がありません')
    }

    return ApiResponse.success({
      application,
      game
    })
  } catch (error) {
    console.error('申請詳細取得エラー:', error)
    return ApiResponse.serverError('申請詳細の取得に失敗しました')
  }
}

// PUT /api/applications/[id] - 申請ステータス更新
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

    const { id: applicationId } = await params

    if (!applicationId) {
      return ApiResponse.error('申請IDが指定されていません')
    }

    const bodyResult = await parseRequestBody(req, ['status'])
    if (!bodyResult.success) {
      return ApiResponse.error(bodyResult.error, 400)
    }

    // Zodでバリデーション
    const validation = updateApplicationSchema.safeParse(bodyResult.data)
    if (!validation.success) {
      return ApiResponse.error(
        validation.error.issues[0].message,
        400,
        validation.error.issues
      )
    }

    const { status } = validation.data

    // ステータス値の検証
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return ApiResponse.error('ステータスはpending、approved、rejectedのいずれかを指定してください')
    }

    // 申請の存在確認
    const application = await getApplicationById(applicationId)
    if (!application) {
      return ApiResponse.notFound('指定された申請が見つかりません')
    }

    // ゲーム情報を取得
    const game = await getGameById(application.game_id)
    if (!game) {
      return ApiResponse.notFound('関連するゲームが見つかりません')
    }

    // ゲームオーナーのみがステータス更新可能
    if (game.owner_id !== user.id) {
      return ApiResponse.forbidden('この申請のステータスを変更する権限がありません')
    }

    // 既に処理済みの申請は変更できない
    if (application.status !== 'pending' && status !== 'pending') {
      return ApiResponse.error('既に処理済みの申請です')
    }

    // approvedの場合、マッチを作成
    if (status === 'approved') {
      // ゲームが既にマッチング済みでないかチェック
      if (game.status === 'matched') {
        return ApiResponse.error('このゲームは既にマッチング済みです')
      }

      const matchData: CreateMatchInput = {
        game_id: game.id,
        application_id: application.id,
        host_team_name: game.team_name,
        guest_team_name: application.applicant_team_name,
        host_contact: game.contact,
        guest_contact: application.applicant_contact,
        host_id: game.owner_id,
        guest_id: application.applicant_id,
        sport: game.sport,
        date: game.date,
        time: game.time,
        location: game.location,
        description: game.description
      }

      const match = await createMatch(matchData)

      if (!match) {
        return ApiResponse.error('マッチの作成に失敗しました')
      }

      return ApiResponse.success({
        application: await getApplicationById(applicationId),
        match,
        message: 'マッチが成立しました！'
      })
    } else {
      // approved以外の場合は通常のステータス更新
      const success = await updateApplicationStatus(applicationId, status as 'pending' | 'approved' | 'rejected', user.id)

      if (!success) {
        return ApiResponse.error('申請ステータスの更新に失敗しました')
      }

      const updatedApplication = await getApplicationById(applicationId)

      return ApiResponse.success({
        application: updatedApplication,
        message: status === 'rejected' ? '申請を拒否しました' : '申請ステータスを更新しました'
      })
    }
  } catch (error) {
    console.error('申請ステータス更新エラー:', error)
    return ApiResponse.serverError('申請ステータスの更新に失敗しました')
  }
}

// DELETE /api/applications/[id] - 申請削除
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

    const { id: applicationId } = await params

    if (!applicationId) {
      return ApiResponse.error('申請IDが指定されていません')
    }

    // 申請の存在確認
    const application = await getApplicationById(applicationId)
    if (!application) {
      return ApiResponse.notFound('指定された申請が見つかりません')
    }

    // 申請者のみが削除可能
    if (application.applicant_id !== user.id) {
      return ApiResponse.forbidden('この申請を削除する権限がありません')
    }

    // pending状態の申請のみ削除可能
    if (application.status !== 'pending') {
      return ApiResponse.error('処理済みの申請は削除できません')
    }

    const success = await deleteApplication(applicationId, user.id)

    if (!success) {
      return ApiResponse.error('申請の削除に失敗しました')
    }

    return ApiResponse.success({
      message: '申請が正常に削除されました',
      deletedApplicationId: applicationId
    })
  } catch (error) {
    console.error('申請削除エラー:', error)
    return ApiResponse.serverError('申請の削除に失敗しました')
  }
}