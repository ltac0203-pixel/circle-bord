import { applyForGame, createGame, updateGame, deleteGame } from '../games'
import { executeQuery } from '../../../lib/db'
import { getSession } from '../../../lib/auth'
import { revalidateTag } from 'next/cache'
import { createMockFormData } from '../../../test-utils/render'

// Mock dependencies
jest.mock('../../../lib/db')
jest.mock('../../../lib/auth')
jest.mock('next/cache')

const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockRevalidateTag = revalidateTag as jest.MockedFunction<typeof revalidateTag>

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com'
}

const mockSession = {
  user: mockUser,
  expires: '2025-12-31T23:59:59.999Z'
}

describe('Games Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  describe('applyForGame', () => {
    it('successfully applies for a game', async () => {
      // Mock no existing application
      mockExecuteQuery.mockResolvedValueOnce([])
      // Mock successful insertion
      mockExecuteQuery.mockResolvedValueOnce(undefined)

      const result = await applyForGame('game-1', 'よろしくお願いします')

      expect(result.success).toBe(true)
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'SELECT id FROM applications WHERE game_id = ? AND applicant_id = ?',
        ['game-1', '1']
      )
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        `INSERT INTO applications (game_id, applicant_id, message, status) 
       VALUES (?, ?, ?, 'pending')`,
        ['game-1', '1', 'よろしくお願いします']
      )
      expect(mockRevalidateTag).toHaveBeenCalledWith('applications')
    })

    it('prevents duplicate application', async () => {
      // Mock existing application
      mockExecuteQuery.mockResolvedValueOnce([{ id: '1' }])

      const result = await applyForGame('game-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('既に申請済みです')
      expect(mockExecuteQuery).toHaveBeenCalledTimes(1)
    })

    it('handles application without message', async () => {
      mockExecuteQuery.mockResolvedValueOnce([])
      mockExecuteQuery.mockResolvedValueOnce(undefined)

      const result = await applyForGame('game-1')

      expect(result.success).toBe(true)
      expect(mockExecuteQuery).toHaveBeenLastCalledWith(
        expect.any(String),
        ['game-1', '1', null]
      )
    })

    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      await expect(applyForGame('game-1')).rejects.toThrow('Unauthorized')
    })

    it('handles database errors', async () => {
      mockExecuteQuery.mockRejectedValue(new Error('Database error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const result = await applyForGame('game-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('申請に失敗しました')
      expect(consoleSpy).toHaveBeenCalledWith('Application error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('createGame', () => {
    it('successfully creates a game with valid data', async () => {
      const formData = createMockFormData({
        teamName: 'テストチーム',
        date: '2025-12-01',
        time: '14:00',
        location: 'テスト体育館',
        participants: '10',
        description: 'テスト試合です'
      })

      mockExecuteQuery.mockResolvedValue(undefined)

      const result = await createGame(formData)

      expect(result.success).toBe(true)
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO games'),
        [
          'テストチーム',
          '2025-12-01',
          '14:00',
          'テスト体育館',
          10,
          'テスト試合です',
          '1'
        ]
      )
      expect(mockRevalidateTag).toHaveBeenCalledWith('games')
    })

    it('creates game without optional description', async () => {
      const formData = createMockFormData({
        teamName: 'テストチーム',
        date: '2025-12-01',
        time: '14:00',
        location: 'テスト体育館',
        participants: '10',
        description: ''
      })

      mockExecuteQuery.mockResolvedValue(undefined)

      const result = await createGame(formData)

      expect(result.success).toBe(true)
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO games'),
        expect.arrayContaining([null])
      )
    })

    it('validates required fields', async () => {
      const formData = createMockFormData({
        teamName: '',
        date: '2025-12-01',
        time: '14:00',
        location: 'テスト体育館',
        participants: '10'
      })

      const result = await createGame(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(mockExecuteQuery).not.toHaveBeenCalled()
    })

    it('validates date format', async () => {
      const formData = createMockFormData({
        teamName: 'テストチーム',
        date: 'invalid-date',
        time: '14:00',
        location: 'テスト体育館',
        participants: '10'
      })

      const result = await createGame(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('validates participants as number', async () => {
      const formData = createMockFormData({
        teamName: 'テストチーム',
        date: '2025-12-01',
        time: '14:00',
        location: 'テスト体育館',
        participants: 'not-a-number'
      })

      const result = await createGame(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const formData = createMockFormData({
        teamName: 'テストチーム',
        date: '2025-12-01',
        time: '14:00',
        location: 'テスト体育館',
        participants: '10'
      })

      await expect(createGame(formData)).rejects.toThrow('Unauthorized')
    })

    it('handles database errors', async () => {
      const formData = createMockFormData({
        teamName: 'テストチーム',
        date: '2025-12-01',
        time: '14:00',
        location: 'テスト体育館',
        participants: '10'
      })

      mockExecuteQuery.mockRejectedValue(new Error('Database error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const result = await createGame(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ゲームの作成に失敗しました')
      expect(consoleSpy).toHaveBeenCalledWith('Game creation error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('updateGame', () => {
    it('successfully updates a game', async () => {
      const formData = createMockFormData({
        teamName: '更新されたチーム',
        date: '2025-12-02',
        time: '15:00',
        location: '更新された体育館',
        participants: '12',
        description: '更新された説明'
      })

      mockExecuteQuery.mockResolvedValue(undefined)

      const result = await updateGame('game-1', formData)

      expect(result.success).toBe(true)
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE games SET'),
        expect.arrayContaining(['更新されたチーム', 'game-1'])
      )
      expect(mockRevalidateTag).toHaveBeenCalledWith('games')
    })

    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const formData = createMockFormData({
        teamName: 'テストチーム',
        date: '2025-12-01',
        time: '14:00',
        location: 'テスト体育館',
        participants: '10'
      })

      await expect(updateGame('game-1', formData)).rejects.toThrow('Unauthorized')
    })
  })

  describe('deleteGame', () => {
    it('successfully deletes a game', async () => {
      mockExecuteQuery.mockResolvedValue(undefined)

      const result = await deleteGame('game-1')

      expect(result.success).toBe(true)
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'DELETE FROM games WHERE id = ? AND created_by = ?',
        ['game-1', '1']
      )
      expect(mockRevalidateTag).toHaveBeenCalledWith('games')
    })

    it('returns error when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      await expect(deleteGame('game-1')).rejects.toThrow('Unauthorized')
    })

    it('handles database errors', async () => {
      mockExecuteQuery.mockRejectedValue(new Error('Database error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const result = await deleteGame('game-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ゲームの削除に失敗しました')
      expect(consoleSpy).toHaveBeenCalledWith('Game deletion error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })
})