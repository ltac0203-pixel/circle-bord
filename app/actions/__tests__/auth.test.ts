import { signIn, signUp, signOut } from '../auth'
import { validateUser, createUser } from '../../../lib/db/users'
import { createSession, deleteSession } from '../../../lib/auth'
import { createMockFormData } from '../../../test-utils/render'

// Mock dependencies
jest.mock('../../../lib/db/users')
jest.mock('../../../lib/auth')

const mockValidateUser = validateUser as jest.MockedFunction<typeof validateUser>
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>
const mockCreateSession = createSession as jest.MockedFunction<typeof createSession>
const mockDeleteSession = deleteSession as jest.MockedFunction<typeof deleteSession>

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedpassword',
  created_at: '2025-09-09T00:00:00Z',
  updated_at: '2025-09-09T00:00:00Z'
}

describe('Auth Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signIn', () => {
    it('successfully signs in with valid credentials', async () => {
      const formData = createMockFormData({
        email: 'test@example.com',
        password: 'password123'
      })

      mockValidateUser.mockResolvedValue(mockUser)
      mockCreateSession.mockResolvedValue(undefined)

      const result = await signIn(formData)

      expect(result.success).toBe(true)
      expect(mockValidateUser).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockCreateSession).toHaveBeenCalledWith({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email
      })
    })

    it('fails with invalid credentials', async () => {
      const formData = createMockFormData({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      mockValidateUser.mockResolvedValue(null)

      const result = await signIn(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('メールアドレスまたはパスワードが正しくありません')
      expect(mockCreateSession).not.toHaveBeenCalled()
    })

    it('validates email format', async () => {
      const formData = createMockFormData({
        email: 'invalid-email',
        password: 'password123'
      })

      const result = await signIn(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(mockValidateUser).not.toHaveBeenCalled()
    })

    it('validates password requirement', async () => {
      const formData = createMockFormData({
        email: 'test@example.com',
        password: ''
      })

      const result = await signIn(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(mockValidateUser).not.toHaveBeenCalled()
    })

    it('handles authentication errors', async () => {
      const formData = createMockFormData({
        email: 'test@example.com',
        password: 'password123'
      })

      mockValidateUser.mockRejectedValue(new Error('Database error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const result = await signIn(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ログイン中にエラーが発生しました')
      expect(consoleSpy).toHaveBeenCalledWith('Sign in error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('handles session creation errors', async () => {
      const formData = createMockFormData({
        email: 'test@example.com',
        password: 'password123'
      })

      mockValidateUser.mockResolvedValue(mockUser)
      mockCreateSession.mockRejectedValue(new Error('Session error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const result = await signIn(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ログイン中にエラーが発生しました')
      expect(consoleSpy).toHaveBeenCalledWith('Sign in error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('signUp', () => {
    it('successfully creates a new user', async () => {
      const formData = createMockFormData({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      })

      mockCreateUser.mockResolvedValue(mockUser)

      const result = await signUp(formData)

      expect(result.success).toBe(true)
      expect(mockCreateUser).toHaveBeenCalledWith('New User', 'newuser@example.com', 'password123')
    })

    it('fails when email is already taken', async () => {
      const formData = createMockFormData({
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123'
      })

      mockCreateUser.mockResolvedValue(null)

      const result = await signUp(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ユーザーの作成に失敗しました。メールアドレスが既に使用されている可能性があります。')
    })

    it('validates name requirement', async () => {
      const formData = createMockFormData({
        name: '',
        email: 'test@example.com',
        password: 'password123'
      })

      const result = await signUp(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(mockCreateUser).not.toHaveBeenCalled()
    })

    it('validates email format', async () => {
      const formData = createMockFormData({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      })

      const result = await signUp(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(mockCreateUser).not.toHaveBeenCalled()
    })

    it('validates password length', async () => {
      const formData = createMockFormData({
        name: 'Test User',
        email: 'test@example.com',
        password: '123' // Too short
      })

      const result = await signUp(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(mockCreateUser).not.toHaveBeenCalled()
    })

    it('handles user creation errors', async () => {
      const formData = createMockFormData({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })

      mockCreateUser.mockRejectedValue(new Error('Database error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const result = await signUp(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('登録中にエラーが発生しました')
      expect(consoleSpy).toHaveBeenCalledWith('Sign up error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('signOut', () => {
    it('successfully signs out', async () => {
      mockDeleteSession.mockResolvedValue(undefined)

      const result = await signOut()

      expect(result.success).toBe(true)
      expect(mockDeleteSession).toHaveBeenCalled()
    })

    it('handles sign out errors', async () => {
      mockDeleteSession.mockRejectedValue(new Error('Session error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const result = await signOut()

      expect(result.success).toBe(false)
      expect(result.error).toBe('ログアウト中にエラーが発生しました')
      expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })
})