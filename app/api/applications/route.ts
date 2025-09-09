import { NextRequest } from 'next/server'
import { requireAuth, ApiResponse, parseRequestBody, checkHttpMethod } from '@/lib/api-auth'
import { 
  getApplicationsByUser,
  getReceivedApplicationsByUser,
  createApplication,
  checkExistingApplication,
  CreateApplicationInput 
} from '@/lib/db/applications'
import { getGameById } from '@/lib/db/games'
import { z } from 'zod'

// バリデーションスキーマ
const createApplicationSchema = z.object({
  game_id: z.string().min(1, 'ゲームIDを指定してください'),
  applicant_team_name: z.string().min(1, 'チーム名を入力してください'),
  applicant_contact: z.string().min(1, '連絡先を入力してください'),
  message: z.string().optional()
})

// GET /api/applications - 申請一覧取得
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
    const type = searchParams.get('type') // 'sent' or 'received'

    let applications

    if (type === 'received') {
      // 受け取った申請（ゲームオーナー向け）
      applications = await getReceivedApplicationsByUser(user.id)
    } else {
      // 送信した申請（デフォルト）
      applications = await getApplicationsByUser(user.id)
    }

    return ApiResponse.success({
      type: type || 'sent',
      count: applications.length,
      applications
    })
  } catch (error) {
    console.error('申請取得エラー:', error)
    return ApiResponse.serverError('申請の取得に失敗しました')
  }
}

// POST /api/applications - 新しい申請作成
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

    const bodyResult = await parseRequestBody<CreateApplicationInput>(req, [
      'game_id', 'applicant_team_name', 'applicant_contact'
    ])

    if (!bodyResult.success) {
      return ApiResponse.error(bodyResult.error, 400)
    }

    // Zodでバリデーション
    const validation = createApplicationSchema.safeParse(bodyResult.data)
    if (!validation.success) {
      return ApiResponse.error(
        validation.error.issues[0].message,
        400,
        validation.error.issues
      )
    }

    const applicationData: CreateApplicationInput = {
      ...validation.data,
      applicant_id: user.id
    }

    // ゲームの存在確認
    const game = await getGameById(applicationData.game_id)
    if (!game) {
      return ApiResponse.notFound('指定されたゲームが見つかりません')
    }

    // 自分のゲームには申請できない
    if (game.owner_id === user.id) {
      return ApiResponse.error('自分の募集には申請できません')
    }

    // ゲームがオープン状態でない場合は申請できない
    if (game.status !== 'open') {
      return ApiResponse.error('この募集は既にマッチング済みです')
    }

    // 過去の日付のゲームには申請できない
    const gameDate = new Date(game.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (gameDate < today) {
      return ApiResponse.error('過去の日付のゲームには申請できません')
    }

    // 重複申請チェック
    const existingApplication = await checkExistingApplication(
      applicationData.game_id,
      user.id
    )

    if (existingApplication) {
      return ApiResponse.error('既にこのゲームに申請済みです')
    }

    const newApplication = await createApplication(applicationData)

    if (!newApplication) {
      return ApiResponse.error('申請の作成に失敗しました')
    }

    return ApiResponse.success(newApplication, 201)
  } catch (error) {
    console.error('申請作成エラー:', error)
    return ApiResponse.serverError('申請の作成に失敗しました')
  }
}