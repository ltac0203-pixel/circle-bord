# Phase 8: テストとデバッグ

## 📋 概要
Next.js App Router対応のテスト環境を再構築し、既存テストを移行・新規テストを実装します。

**推定所要時間**: 2日

## ✅ Task 8.1: テスト環境の再構築

### 8.1.1: Jest設定のNext.js対応

**ファイル**: `jest.config.js`
```javascript
const nextJest = require('next/jest')

// Next.js のJest設定を読み込み
const createJestConfig = nextJest({
  // Next.js アプリのパスを指定
  dir: './',
})

// カスタムJest設定
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  moduleNameMapping: {
    // next.config.jsのパスエイリアスと同じ設定
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

// Next.jsの設定を適用
module.exports = createJestConfig(customJestConfig)
```

**ファイル**: `jest.setup.js`
```javascript
import '@testing-library/jest-dom'
import { server } from './mocks/server'

// MSW (Mock Service Worker) の設定
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// 環境変数のモック
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
process.env.JWT_SECRET = 'test-secret'

// IntersectionObserverのモック
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ResizeObserverのモック
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
```

### 8.1.2: Testing Library設定

**テストユーティリティの作成**

**ファイル**: `test-utils/render.tsx`
```tsx
import React, { ReactElement } from 'react'\nimport { render, RenderOptions } from '@testing-library/react'\nimport { AuthProvider } from '@/components/providers/AuthProvider'\n\n// モックユーザー\nconst mockUser = {\n  id: '1',\n  name: 'Test User',\n  email: 'test@example.com'\n}\n\n// プロバイダーラッパー\nconst AllTheProviders = ({ children }: { children: React.ReactNode }) => {\n  return (\n    <AuthProvider initialUser={mockUser}>\n      {children}\n    </AuthProvider>\n  )\n}\n\n// カスタムレンダー関数\nconst customRender = (\n  ui: ReactElement,\n  options?: Omit<RenderOptions, 'wrapper'> & {\n    withAuth?: boolean\n  }\n) => {\n  const { withAuth = true, ...renderOptions } = options || {}\n  \n  return render(ui, {\n    wrapper: withAuth ? AllTheProviders : undefined,\n    ...renderOptions,\n  })\n}\n\nexport * from '@testing-library/react'\nexport { customRender as render }\nexport { mockUser }\n```

**ファイル**: `test-utils/server.ts`
```typescript\nimport { setupServer } from 'msw/node'\nimport { rest } from 'msw'\n\n// APIモックハンドラー\nexport const handlers = [\n  // 認証API\n  rest.post('/api/auth/login', (req, res, ctx) => {\n    return res(\n      ctx.json({\n        success: true,\n        user: {\n          id: '1',\n          name: 'Test User',\n          email: 'test@example.com'\n        }\n      })\n    )\n  }),\n  \n  // ゲームAPI\n  rest.get('/api/games', (req, res, ctx) => {\n    return res(\n      ctx.json({\n        games: [\n          {\n            id: '1',\n            team_name: 'テストチーム',\n            date: '2025-12-01',\n            time: '14:00',\n            location: 'テスト体育館',\n            participants: 10,\n            description: 'テスト試合です'\n          }\n        ],\n        total: 1\n      })\n    )\n  }),\n  \n  rest.post('/api/games', (req, res, ctx) => {\n    return res(\n      ctx.json({\n        success: true,\n        game: {\n          id: '2',\n          team_name: '新規チーム',\n          date: '2025-12-15',\n          time: '15:00',\n          location: '新規体育館',\n          participants: 8\n        }\n      })\n    )\n  }),\n  \n  // 申請API\n  rest.get('/api/applications', (req, res, ctx) => {\n    return res(\n      ctx.json([\n        {\n          id: '1',\n          game_id: '1',\n          applicant_id: '2',\n          status: 'pending',\n          team_name: 'テストチーム',\n          applicant_name: '申請者'\n        }\n      ])\n    )\n  }),\n]\n\nexport const server = setupServer(...handlers)\n```\n\n### 8.1.3: E2Eテスト環境の設定（Playwright）\n\n**インストール**\n```bash\nnpm install --save-dev @playwright/test\nnpx playwright install\n```\n\n**ファイル**: `playwright.config.ts`\n```typescript\nimport { defineConfig, devices } from '@playwright/test'\n\nexport default defineConfig({\n  testDir: './e2e',\n  timeout: 30 * 1000,\n  expect: {\n    timeout: 5000\n  },\n  fullyParallel: true,\n  forbidOnly: !!process.env.CI,\n  retries: process.env.CI ? 2 : 0,\n  workers: process.env.CI ? 1 : undefined,\n  reporter: 'html',\n  use: {\n    baseURL: 'http://localhost:3000',\n    trace: 'on-first-retry',\n  },\n  projects: [\n    {\n      name: 'chromium',\n      use: { ...devices['Desktop Chrome'] },\n    },\n    {\n      name: 'firefox',\n      use: { ...devices['Desktop Firefox'] },\n    },\n    {\n      name: 'webkit',\n      use: { ...devices['Desktop Safari'] },\n    },\n    // モバイルテスト\n    {\n      name: 'Mobile Chrome',\n      use: { ...devices['Pixel 5'] },\n    },\n  ],\n  webServer: {\n    command: 'npm run dev',\n    url: 'http://localhost:3000',\n    reuseExistingServer: !process.env.CI,\n  },\n})\n```\n\n## ✅ Task 8.2: 既存テストの移行と新規テスト実装\n\n### 8.2.1: コンポーネントテストの移行\n\n**ファイル**: `components/__tests__/Header.test.tsx`\n```tsx\nimport { render, screen, fireEvent } from '@/test-utils/render'\nimport Header from '@/components/layouts/Header'\nimport { mockUser } from '@/test-utils/render'\n\n// ルーター関数のモック\njest.mock('next/navigation', () => ({\n  useRouter: () => ({\n    push: jest.fn(),\n    refresh: jest.fn(),\n  }),\n}))\n\ndescribe('Header Component', () => {\n  it('ユーザー名が表示される', () => {\n    render(<Header user={mockUser} />)\n    \n    expect(screen.getByText(mockUser.name)).toBeInTheDocument()\n  })\n  \n  it('ログアウトボタンがクリックできる', () => {\n    render(<Header user={mockUser} />)\n    \n    const logoutButton = screen.getByRole('button', { name: /ログアウト/ })\n    expect(logoutButton).toBeInTheDocument()\n    \n    fireEvent.click(logoutButton)\n    // Server Actionのテストは別途実装\n  })\n  \n  it('ナビゲーションメニューが表示される', () => {\n    render(<Header user={mockUser} />)\n    \n    expect(screen.getByRole('link', { name: /ダッシュボード/ })).toBeInTheDocument()\n    expect(screen.getByRole('link', { name: /試合一覧/ })).toBeInTheDocument()\n    expect(screen.getByRole('link', { name: /マイゲーム/ })).toBeInTheDocument()\n  })\n})\n```\n\n**ファイル**: `components/__tests__/GameCard.test.tsx`\n```tsx\nimport { render, screen, fireEvent, waitFor } from '@/test-utils/render'\nimport GameCard from '@/components/GameCard'\nimport { server } from '@/test-utils/server'\nimport { rest } from 'msw'\n\nconst mockGame = {\n  id: '1',\n  teamName: 'テストチーム',\n  date: '2025-12-01',\n  time: '14:00',\n  location: 'テスト体育館',\n  participants: 10,\n  description: 'テスト試合です'\n}\n\ndescribe('GameCard Component', () => {\n  it('ゲーム情報が正しく表示される', () => {\n    const onApply = jest.fn()\n    render(<GameCard game={mockGame} onApply={onApply} />)\n    \n    expect(screen.getByText('テストチーム')).toBeInTheDocument()\n    expect(screen.getByText('2025/12/1')).toBeInTheDocument()\n    expect(screen.getByText('14:00')).toBeInTheDocument()\n    expect(screen.getByText('テスト体育館')).toBeInTheDocument()\n    expect(screen.getByText('10人')).toBeInTheDocument()\n  })\n  \n  it('申請ボタンクリックで申請処理が実行される', async () => {\n    const onApply = jest.fn()\n    render(<GameCard game={mockGame} onApply={onApply} />)\n    \n    const applyButton = screen.getByRole('button', { name: /申請する/ })\n    fireEvent.click(applyButton)\n    \n    await waitFor(() => {\n      expect(onApply).toHaveBeenCalledWith(mockGame.id)\n    })\n  })\n  \n  it('申請中の状態が正しく表示される', async () => {\n    // API遅延をシミュレート\n    server.use(\n      rest.post('/api/applications', (req, res, ctx) => {\n        return res(ctx.delay(1000), ctx.json({ success: true }))\n      })\n    )\n    \n    const onApply = jest.fn()\n    render(<GameCard game={mockGame} onApply={onApply} />)\n    \n    const applyButton = screen.getByRole('button', { name: /申請する/ })\n    fireEvent.click(applyButton)\n    \n    expect(screen.getByText('申請中...')).toBeInTheDocument()\n    expect(applyButton).toBeDisabled()\n  })\n  \n  it('申請済みの状態が正しく表示される', () => {\n    const gameWithApplication = { ...mockGame, hasApplied: true }\n    const onApply = jest.fn()\n    render(<GameCard game={gameWithApplication} onApply={onApply} />)\n    \n    expect(screen.getByText('申請済み')).toBeInTheDocument()\n    expect(screen.getByRole('button', { name: /申請済み/ })).toBeDisabled()\n  })\n})\n```\n\n### 8.2.2: Server Actions のテスト\n\n**ファイル**: `app/actions/__tests__/auth.test.ts`\n```typescript\nimport { signIn, signUp } from '@/app/actions/auth'\nimport * as authLib from '@/lib/auth'\nimport * as userDb from '@/lib/db/users'\n\n// モジュールのモック\njest.mock('@/lib/auth')\njest.mock('@/lib/db/users')\njest.mock('next/navigation', () => ({\n  redirect: jest.fn(),\n}))\n\nconst mockCreateSession = authLib.createSession as jest.MockedFunction<typeof authLib.createSession>\nconst mockValidateUser = userDb.validateUser as jest.MockedFunction<typeof userDb.validateUser>\nconst mockCreateUser = userDb.createUser as jest.MockedFunction<typeof userDb.createUser>\n\ndescribe('Auth Actions', () => {\n  beforeEach(() => {\n    jest.clearAllMocks()\n  })\n  \n  describe('signIn', () => {\n    it('正常なログインが成功する', async () => {\n      const mockUser = {\n        id: '1',\n        name: 'Test User',\n        email: 'test@example.com',\n        password: 'hashed',\n        created_at: new Date(),\n        updated_at: new Date()\n      }\n      \n      mockValidateUser.mockResolvedValue(mockUser)\n      mockCreateSession.mockResolvedValue()\n      \n      const formData = new FormData()\n      formData.append('email', 'test@example.com')\n      formData.append('password', 'password123')\n      \n      const result = await signIn(formData)\n      \n      expect(result.success).toBe(true)\n      expect(mockValidateUser).toHaveBeenCalledWith('test@example.com', 'password123')\n      expect(mockCreateSession).toHaveBeenCalled()\n    })\n    \n    it('無効な認証情報でログインが失敗する', async () => {\n      mockValidateUser.mockResolvedValue(null)\n      \n      const formData = new FormData()\n      formData.append('email', 'invalid@example.com')\n      formData.append('password', 'wrongpassword')\n      \n      const result = await signIn(formData)\n      \n      expect(result.success).toBe(false)\n      expect(result.error).toContain('メールアドレスまたはパスワードが正しくありません')\n      expect(mockCreateSession).not.toHaveBeenCalled()\n    })\n    \n    it('バリデーションエラーが正しく処理される', async () => {\n      const formData = new FormData()\n      formData.append('email', 'invalid-email')\n      formData.append('password', '123') // 短すぎるパスワード\n      \n      const result = await signIn(formData)\n      \n      expect(result.success).toBe(false)\n      expect(result.error).toBeDefined()\n    })\n  })\n  \n  describe('signUp', () => {\n    it('正常な登録が成功する', async () => {\n      const mockUser = {\n        id: '1',\n        name: 'New User',\n        email: 'new@example.com',\n        password: 'hashed',\n        created_at: new Date(),\n        updated_at: new Date()\n      }\n      \n      mockCreateUser.mockResolvedValue(mockUser)\n      \n      const formData = new FormData()\n      formData.append('name', 'New User')\n      formData.append('email', 'new@example.com')\n      formData.append('password', 'password123')\n      \n      const result = await signUp(formData)\n      \n      expect(result.success).toBe(true)\n      expect(mockCreateUser).toHaveBeenCalledWith('New User', 'new@example.com', 'password123')\n    })\n  })\n})\n```\n\n### 8.2.3: API Routes のテスト\n\n**ファイル**: `app/api/__tests__/games.test.ts`\n```typescript\nimport { GET, POST } from '@/app/api/games/route'\nimport { NextRequest } from 'next/server'\nimport * as auth from '@/lib/auth'\nimport * as db from '@/lib/db'\n\n// モジュールのモック\njest.mock('@/lib/auth')\njest.mock('@/lib/db')\n\nconst mockGetSession = auth.getSession as jest.MockedFunction<typeof auth.getSession>\nconst mockExecuteQuery = db.executeQuery as jest.MockedFunction<typeof db.executeQuery>\n\ndescribe('/api/games', () => {\n  beforeEach(() => {\n    jest.clearAllMocks()\n  })\n  \n  describe('GET', () => {\n    it('ゲーム一覧を正しく返す', async () => {\n      const mockGames = [\n        {\n          id: '1',\n          team_name: 'Test Team',\n          date: '2025-12-01',\n          time: '14:00',\n          location: 'Test Gym',\n          participants: 10\n        }\n      ]\n      \n      mockExecuteQuery.mockResolvedValueOnce(mockGames)\n      mockExecuteQuery.mockResolvedValueOnce([{ count: 1 }])\n      \n      const request = new NextRequest('http://localhost:3000/api/games')\n      const response = await GET(request)\n      const data = await response.json()\n      \n      expect(response.status).toBe(200)\n      expect(data.games).toEqual(mockGames)\n      expect(data.total).toBe(1)\n    })\n    \n    it('クエリパラメータが正しく処理される', async () => {\n      mockExecuteQuery.mockResolvedValueOnce([])\n      mockExecuteQuery.mockResolvedValueOnce([{ count: 0 }])\n      \n      const request = new NextRequest('http://localhost:3000/api/games?limit=10&offset=20')\n      await GET(request)\n      \n      expect(mockExecuteQuery).toHaveBeenCalledWith(\n        expect.any(String),\n        [10, 20]\n      )\n    })\n  })\n  \n  describe('POST', () => {\n    const mockSession = {\n      user: { id: '1', name: 'Test User', email: 'test@example.com' },\n      expires: '2025-12-31'\n    }\n    \n    it('認証済みユーザーがゲームを作成できる', async () => {\n      mockGetSession.mockResolvedValue(mockSession)\n      mockExecuteQuery.mockResolvedValueOnce({ insertId: 1 })\n      mockExecuteQuery.mockResolvedValueOnce([{ id: '1', team_name: 'New Team' }])\n      \n      const request = new NextRequest('http://localhost:3000/api/games', {\n        method: 'POST',\n        body: JSON.stringify({\n          teamName: 'New Team',\n          date: '2025-12-01',\n          time: '14:00',\n          location: 'New Gym',\n          participants: 8\n        }),\n      })\n      \n      const response = await POST(request)\n      const data = await response.json()\n      \n      expect(response.status).toBe(201)\n      expect(data.success).toBe(true)\n      expect(data.game).toBeDefined()\n    })\n    \n    it('未認証ユーザーはゲームを作成できない', async () => {\n      mockGetSession.mockResolvedValue(null)\n      \n      const request = new NextRequest('http://localhost:3000/api/games', {\n        method: 'POST',\n        body: JSON.stringify({}),\n      })\n      \n      const response = await POST(request)\n      \n      expect(response.status).toBe(401)\n    })\n  })\n})\n```\n\n### 8.2.4: E2Eテストの実装\n\n**ファイル**: `e2e/auth.spec.ts`\n```typescript\nimport { test, expect } from '@playwright/test'\n\ntest.describe('認証フロー', () => {\n  test('サインアップからログインまでの完全フロー', async ({ page }) => {\n    // サインアップページに移動\n    await page.goto('/signup')\n    \n    // フォームに入力\n    await page.fill('input[name=\"name\"]', 'Test User')\n    await page.fill('input[name=\"email\"]', 'test@example.com')\n    await page.fill('input[name=\"password\"]', 'password123')\n    await page.fill('input[name=\"confirmPassword\"]', 'password123')\n    \n    // 登録ボタンクリック\n    await page.click('button[type=\"submit\"]')\n    \n    // ログインページにリダイレクトされる\n    await expect(page).toHaveURL('/signin')\n    \n    // ログインフォームに入力\n    await page.fill('input[name=\"email\"]', 'test@example.com')\n    await page.fill('input[name=\"password\"]', 'password123')\n    \n    // ログインボタンクリック\n    await page.click('button[type=\"submit\"]')\n    \n    // ダッシュボードにリダイレクトされる\n    await expect(page).toHaveURL('/dashboard')\n    \n    // ユーザー名が表示される\n    await expect(page.locator('text=Test User')).toBeVisible()\n  })\n  \n  test('ログアウト機能', async ({ page }) => {\n    // ログイン状態でダッシュボードに移動（事前セットアップが必要）\n    await page.goto('/dashboard')\n    \n    // ログアウトボタンクリック\n    await page.click('button:has-text(\"ログアウト\")')\n    \n    // ログインページにリダイレクトされる\n    await expect(page).toHaveURL('/signin')\n  })\n})\n```\n\n**ファイル**: `e2e/games.spec.ts`\n```typescript\nimport { test, expect } from '@playwright/test'\n\ntest.describe('ゲーム機能', () => {\n  test.beforeEach(async ({ page }) => {\n    // 各テスト前にログイン状態にする\n    await page.goto('/signin')\n    await page.fill('input[name=\"email\"]', 'test@example.com')\n    await page.fill('input[name=\"password\"]', 'password123')\n    await page.click('button[type=\"submit\"]')\n    await expect(page).toHaveURL('/dashboard')\n  })\n  \n  test('新規ゲーム作成', async ({ page }) => {\n    // 新規登録ボタンクリック\n    await page.click('button:has-text(\"新規登録\")')\n    \n    // フォームに入力\n    await page.fill('input[name=\"teamName\"]', 'テストチーム')\n    await page.fill('input[name=\"date\"]', '2025-12-01')\n    await page.fill('input[name=\"time\"]', '14:00')\n    await page.fill('input[name=\"location\"]', 'テスト体育館')\n    await page.fill('input[name=\"participants\"]', '10')\n    await page.fill('textarea[name=\"description\"]', 'テストゲームです')\n    \n    // 作成ボタンクリック\n    await page.click('button[type=\"submit\"]')\n    \n    // 成功メッセージまたはゲーム一覧に追加されたことを確認\n    await expect(page.locator('text=テストチーム')).toBeVisible()\n  })\n  \n  test('ゲーム申請', async ({ page }) => {\n    // 既存のゲームカードを探す\n    const gameCard = page.locator('.game-card').first()\n    await expect(gameCard).toBeVisible()\n    \n    // 申請ボタンクリック\n    await gameCard.locator('button:has-text(\"申請する\")').click()\n    \n    // 申請完了の確認\n    await expect(gameCard.locator('button:has-text(\"申請済み\")')).toBeVisible()\n  })\n})\n```\n\n## 📝 確認事項\n\n### テスト環境構築チェックリスト\n\n- [ ] Jest設定がNext.js対応済み\n- [ ] Testing Library設定完了\n- [ ] MSWによるAPIモック設定完了\n- [ ] Playwright E2Eテスト環境構築完了\n- [ ] カバレッジ設定完了\n\n### テスト実装チェックリスト\n\n- [ ] 主要コンポーネントのテスト実装\n- [ ] Server Actionsのテスト実装\n- [ ] API Routesのテスト実装\n- [ ] E2Eテストの実装\n- [ ] エラーハンドリングのテスト\n\n### テスト実行\n\n```bash\n# 単体テスト\nnpm run test\n\n# カバレッジレポート付き\nnpm run test:coverage\n\n# E2Eテスト\nnpm run test:e2e\n\n# 全テスト実行\nnpm run test:all\n```\n\n## ⚠️ 注意事項\n\n1. **テストの独立性**\n   - 各テストが他のテストに影響しないよう設計\n   - テスト前後の適切なクリーンアップ\n\n2. **モックの適切な使用**\n   - 外部依存関係の適切なモック\n   - 実際のAPIコールは避ける\n\n3. **E2Eテストの安定性**\n   - 非同期処理の適切な待機\n   - フレークテストの排除\n\n## 🔄 次のステップ\n\nPhase 8 が完了したら、[Phase 9: デプロイメント準備](./09-phase9-deployment.md) へ進みます。\n\n## 📚 参考資料\n\n- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)\n- [Jest with Next.js](https://nextjs.org/docs/app/building-your-application/testing/jest)\n- [Playwright](https://playwright.dev/)\n- [MSW](https://mswjs.io/)\n\n---\n\n*最終更新: 2025-09-09*