import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// APIモックハンドラー
export const handlers = [
  // 認証API
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com'
        }
      })
    }
    
    return HttpResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    )
  }),
  
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      success: true,
      user: {
        id: '2',
        name: body.name,
        email: body.email
      }
    }, { status: 201 })
  }),
  
  // ゲームAPI
  http.get('/api/games', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    const mockGames = [
      {
        id: '1',
        team_name: 'テストチーム',
        date: '2025-12-01',
        time: '14:00',
        location: 'テスト体育館',
        participants: 10,
        description: 'テスト試合です',
        created_by: '1',
        created_at: '2025-09-09T00:00:00Z',
        updated_at: '2025-09-09T00:00:00Z'
      },
      {
        id: '2',
        team_name: 'サンプルチーム',
        date: '2025-12-15',
        time: '16:00',
        location: 'サンプル体育館',
        participants: 8,
        description: 'サンプル試合です',
        created_by: '2',
        created_at: '2025-09-09T01:00:00Z',
        updated_at: '2025-09-09T01:00:00Z'
      }
    ]
    
    const paginatedGames = mockGames.slice(offset, offset + limit)
    
    return HttpResponse.json({
      games: paginatedGames,
      total: mockGames.length,
      limit,
      offset
    })
  }),
  
  http.post('/api/games', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      success: true,
      game: {
        id: '3',
        team_name: body.teamName,
        date: body.date,
        time: body.time,
        location: body.location,
        participants: body.participants,
        description: body.description,
        created_by: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }, { status: 201 })
  }),
  
  http.get('/api/games/:id', ({ params }) => {
    const gameId = params.id as string
    
    const mockGame = {
      id: gameId,
      team_name: 'テストチーム',
      date: '2025-12-01',
      time: '14:00',
      location: 'テスト体育館',
      participants: 10,
      description: 'テスト試合です',
      created_by: '1',
      created_at: '2025-09-09T00:00:00Z',
      updated_at: '2025-09-09T00:00:00Z'
    }
    
    return HttpResponse.json(mockGame)
  }),
  
  // 申請API
  http.get('/api/applications', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    
    const mockApplications = [
      {
        id: '1',
        game_id: '1',
        applicant_id: '2',
        message: 'よろしくお願いします',
        status: 'pending',
        created_at: '2025-09-09T00:00:00Z',
        team_name: 'テストチーム',
        date: '2025-12-01',
        time: '14:00',
        location: 'テスト体育館',
        applicant_name: '申請者'
      }
    ]
    
    if (type === 'received') {
      return HttpResponse.json({
        type: 'received',
        count: mockApplications.length,
        applications: mockApplications
      })
    }
    
    return HttpResponse.json({
      type: 'sent',
      count: mockApplications.length,
      applications: mockApplications
    })
  }),
  
  http.post('/api/applications', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      success: true,
      application: {
        id: '2',
        game_id: body.gameId,
        applicant_id: '1',
        message: body.message,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    }, { status: 201 })
  }),
  
  http.put('/api/applications/:id', async ({ params, request }) => {
    const applicationId = params.id as string
    const body = await request.json() as any
    
    return HttpResponse.json({
      success: true,
      application: {
        id: applicationId,
        status: body.status,
        updated_at: new Date().toISOString()
      },
      message: body.status === 'approved' ? 'マッチが成立しました！' : '申請ステータスを更新しました'
    })
  }),
]

export const server = setupServer(...handlers)