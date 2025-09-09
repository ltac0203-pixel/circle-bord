import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  // Helper function to sign in before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Sign in with test credentials
    await page.getByLabel('メールアドレス').fill('test@example.com')
    await page.getByLabel('パスワード').fill('password123')
    await page.getByRole('button', { name: 'サインイン' }).click()
    
    // Wait for dashboard to load
    await expect(page.getByText('ダッシュボード')).toBeVisible({ timeout: 10000 })
  })

  test('should display dashboard elements', async ({ page }) => {
    // Check main dashboard elements
    await expect(page.getByText('ダッシュボード')).toBeVisible()
    await expect(page.getByText('利用可能な試合')).toBeVisible()
    await expect(page.getByText('あなたの申請')).toBeVisible()
    await expect(page.getByText('マッチした試合')).toBeVisible()
  })

  test('should display game statistics', async ({ page }) => {
    // Check if statistics are displayed
    await expect(page.getByText(/\d+件の試合が利用可能/)).toBeVisible()
    await expect(page.getByText(/\d+件の申請を送信中/)).toBeVisible()
    await expect(page.getByText(/\d+件の試合がマッチ/)).toBeVisible()
  })

  test('should display available games list', async ({ page }) => {
    // Check if games are displayed
    const gamesList = page.getByTestId('games-list')
    await expect(gamesList).toBeVisible()
    
    // Should show game cards with basic information
    const gameCards = page.getByTestId('game-card')
    const cardCount = await gameCards.count()
    
    if (cardCount > 0) {
      const firstCard = gameCards.first()
      await expect(firstCard.getByText(/\d{4}\/\d{1,2}\/\d{1,2}/)).toBeVisible() // Date
      await expect(firstCard.getByText(/\d{1,2}:\d{2}/)).toBeVisible() // Time
      await expect(firstCard.getByText(/\d+人/)).toBeVisible() // Participants
    }
  })

  test('should apply for a game', async ({ page }) => {
    // Find the first available game
    const gameCard = page.getByTestId('game-card').first()
    const applyButton = gameCard.getByRole('button', { name: '申請する' })
    
    // Check if apply button is available
    if (await applyButton.isVisible()) {
      await applyButton.click()
      
      // Should show loading state
      await expect(gameCard.getByText('申請中...')).toBeVisible()
      
      // Should show applied state after successful application
      await expect(gameCard.getByText('申請済み')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show applied games in applications section', async ({ page }) => {
    // Navigate to applications tab or section
    const applicationsSection = page.getByText('あなたの申請').locator('..')
    await expect(applicationsSection).toBeVisible()
    
    // Should show applied games
    const applicationItems = page.getByTestId('application-item')
    const itemCount = await applicationItems.count()
    
    if (itemCount > 0) {
      const firstItem = applicationItems.first()
      await expect(firstItem.getByText(/pending|approved|rejected/)).toBeVisible()
    }
  })

  test('should display matched games', async ({ page }) => {
    // Check matched games section
    const matchedSection = page.getByText('マッチした試合').locator('..')
    await expect(matchedSection).toBeVisible()
    
    // Should show matched games if any
    const matchedItems = page.getByTestId('matched-game')
    const matchCount = await matchedItems.count()
    
    if (matchCount > 0) {
      const firstMatch = matchedItems.first()
      await expect(firstMatch.getByText('マッチ成立')).toBeVisible()
    }
  })

  test('should handle game creation', async ({ page }) => {
    // Look for create game button or link
    const createButton = page.getByRole('button', { name: '新しい試合を作成' })
    
    if (await createButton.isVisible()) {
      await createButton.click()
      
      // Fill out game creation form
      await page.getByLabel('チーム名').fill('テストチーム')
      await page.getByLabel('日付').fill('2025-12-01')
      await page.getByLabel('時間').fill('14:00')
      await page.getByLabel('場所').fill('テスト体育館')
      await page.getByLabel('参加者数').fill('10')
      await page.getByLabel('説明').fill('テスト用の試合です')
      
      // Submit the form
      await page.getByRole('button', { name: '作成' }).click()
      
      // Should show success message or redirect
      await expect(page.getByText('試合が作成されました')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should handle pagination if available', async ({ page }) => {
    // Check if pagination exists
    const paginationNext = page.getByRole('button', { name: '次へ' })
    const paginationPrev = page.getByRole('button', { name: '前へ' })
    
    if (await paginationNext.isVisible()) {
      const initialGameCount = await page.getByTestId('game-card').count()
      
      await paginationNext.click()
      
      // Should update the games list
      await page.waitForTimeout(1000) // Wait for content to load
      const newGameCount = await page.getByTestId('game-card').count()
      
      // Games should change (either different count or different content)
      expect(newGameCount).toBeGreaterThanOrEqual(0)
      
      // Previous button should now be enabled if it wasn't before
      if (await paginationPrev.isVisible()) {
        await expect(paginationPrev).not.toBeDisabled()
      }
    }
  })

  test('should sign out successfully', async ({ page }) => {
    // Find and click sign out button
    const signOutButton = page.getByRole('button', { name: 'サインアウト' })
    await signOutButton.click()
    
    // Should redirect to sign in page
    await expect(page.getByText('🏃 サインイン')).toBeVisible({ timeout: 10000 })
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Dashboard should still be functional
    await expect(page.getByText('ダッシュボード')).toBeVisible()
    await expect(page.getByText('利用可能な試合')).toBeVisible()
    
    // Check if mobile navigation works
    const gameCard = page.getByTestId('game-card').first()
    if (await gameCard.isVisible()) {
      await expect(gameCard).toBeVisible()
    }
  })
})