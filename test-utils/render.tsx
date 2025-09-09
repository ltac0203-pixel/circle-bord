import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// モックユーザー
export const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com'
}

// モックセッション
export const mockSession = {
  user: mockUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

// 認証プロバイダーのモック（実際のプロバイダーが実装されている場合に使用）
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  // 実際のAuthProviderが実装されている場合は、それを使用
  // 現在はシンプルなラッパーとして機能
  return <div data-testid="auth-provider">{children}</div>
}

// プロバイダーラッパー
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockAuthProvider>
      {children}
    </MockAuthProvider>
  )
}

// カスタムレンダー関数
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    withAuth?: boolean
  }
) => {
  const { withAuth = true, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: withAuth ? AllTheProviders : undefined,
    ...renderOptions,
  })
}

// テスト用のヘルパー関数
export const createMockFormData = (data: Record<string, string>): FormData => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

export const createMockGame = (overrides = {}) => ({
  id: '1',
  team_name: 'テストチーム',
  date: '2025-12-01',
  time: '14:00',
  location: 'テスト体育館',
  participants: 10,
  description: 'テスト試合です',
  created_by: '1',
  created_at: '2025-09-09T00:00:00Z',
  updated_at: '2025-09-09T00:00:00Z',
  ...overrides
})

export const createMockApplication = (overrides = {}) => ({
  id: '1',
  game_id: '1',
  applicant_id: '2',
  message: 'よろしくお願いします',
  status: 'pending' as const,
  created_at: '2025-09-09T00:00:00Z',
  team_name: 'テストチーム',
  date: '2025-12-01',
  time: '14:00',
  location: 'テスト体育館',
  applicant_name: '申請者',
  ...overrides
})

export * from '@testing-library/react'
export { customRender as render }