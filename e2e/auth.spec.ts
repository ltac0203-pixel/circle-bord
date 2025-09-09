import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test('should display sign in page', async ({ page }) => {
    // Should redirect to sign in page when not authenticated
    await expect(page).toHaveTitle(/Circle Bord/)
    await expect(page.getByText('🏃 サインイン')).toBeVisible()
    await expect(page.getByText('大学サークル練習試合マッチング')).toBeVisible()
  })

  test('should show sign up form', async ({ page }) => {
    // Navigate to sign up page
    await page.getByRole('link', { name: 'アカウントを作成' }).click()
    
    await expect(page.getByText('🏃 アカウント作成')).toBeVisible()
    await expect(page.getByLabel('名前')).toBeVisible()
    await expect(page.getByLabel('メールアドレス')).toBeVisible()
    await expect(page.getByLabel('パスワード')).toBeVisible()
  })

  test('should sign up new user', async ({ page }) => {
    // Navigate to sign up page
    await page.getByRole('link', { name: 'アカウントを作成' }).click()
    
    // Fill out the form
    await page.getByLabel('名前').fill('テストユーザー')
    await page.getByLabel('メールアドレス').fill('test@example.com')
    await page.getByLabel('パスワード').fill('password123')
    
    // Submit the form
    await page.getByRole('button', { name: 'アカウント作成' }).click()
    
    // Should show success message or redirect
    await expect(page.getByText('アカウントが作成されました')).toBeVisible({ timeout: 10000 })
  })

  test('should sign in existing user', async ({ page }) => {
    // Fill out sign in form
    await page.getByLabel('メールアドレス').fill('test@example.com')
    await page.getByLabel('パスワード').fill('password123')
    
    // Submit the form
    await page.getByRole('button', { name: 'サインイン' }).click()
    
    // Should redirect to dashboard
    await expect(page.getByText('ダッシュボード')).toBeVisible({ timeout: 10000 })
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill out sign in form with invalid credentials
    await page.getByLabel('メールアドレス').fill('invalid@example.com')
    await page.getByLabel('パスワード').fill('wrongpassword')
    
    // Submit the form
    await page.getByRole('button', { name: 'サインイン' }).click()
    
    // Should show error message
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    // Fill out form with invalid email
    await page.getByLabel('メールアドレス').fill('invalid-email')
    await page.getByLabel('パスワード').fill('password123')
    
    // Submit the form
    await page.getByRole('button', { name: 'サインイン' }).click()
    
    // Should show validation error
    await expect(page.getByText(/無効なメールアドレス|正しいメールアドレス/)).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Submit form without filling fields
    await page.getByRole('button', { name: 'サインイン' }).click()
    
    // Should show validation errors
    const emailInput = page.getByLabel('メールアドレス')
    const passwordInput = page.getByLabel('パスワード')
    
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('should show loading state during sign in', async ({ page }) => {
    // Fill out form
    await page.getByLabel('メールアドレス').fill('test@example.com')
    await page.getByLabel('パスワード').fill('password123')
    
    // Click submit and check for loading state
    const submitButton = page.getByRole('button', { name: 'サインイン' })
    await submitButton.click()
    
    // Should show loading text briefly
    await expect(page.getByText('サインイン中...')).toBeVisible()
    await expect(submitButton).toBeDisabled()
  })

  test('should navigate between sign in and sign up pages', async ({ page }) => {
    // Start on sign in page
    await expect(page.getByText('🏃 サインイン')).toBeVisible()
    
    // Navigate to sign up
    await page.getByRole('link', { name: 'アカウントを作成' }).click()
    await expect(page.getByText('🏃 アカウント作成')).toBeVisible()
    
    // Navigate back to sign in
    await page.getByRole('link', { name: 'サインイン' }).click()
    await expect(page.getByText('🏃 サインイン')).toBeVisible()
  })
})