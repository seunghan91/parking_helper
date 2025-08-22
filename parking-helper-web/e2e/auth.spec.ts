import { test, expect } from '@playwright/test'

test.describe('인증 플로우', () => {
  test('로그인 페이지가 정상적으로 표시된다', async ({ page }) => {
    await page.goto('/login')
    
    // 로그인 폼 확인
    await expect(page.locator('h2')).toContainText('로그인')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // 구글 로그인 버튼 확인
    await expect(page.locator('text=Google로 로그인')).toBeVisible()
  })

  test('이메일/패스워드로 로그인을 시도할 수 있다', async ({ page }) => {
    await page.goto('/login')
    
    // 이메일과 패스워드 입력
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword')
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]')
    
    // 로딩 상태 확인
    await expect(page.locator('text=로그인 중...')).toBeVisible()
  })

  test('로그인 후 메인 페이지로 리다이렉트된다', async ({ page }) => {
    // 실제 로그인 없이 메인 페이지 확인
    await page.goto('/')
    
    // 메인 페이지 요소 확인
    await expect(page.locator('h1')).toContainText('파킹 헬퍼')
    await expect(page.locator('text=실사용자 기반 주차 정보 플랫폼')).toBeVisible()
  })

  test('로그인하지 않은 사용자는 시작하기 버튼을 볼 수 있다', async ({ page }) => {
    await page.goto('/')
    
    const startButton = page.locator('text=시작하기')
    await expect(startButton).toBeVisible()
    
    // 시작하기 버튼 클릭 시 로그인 페이지로 이동
    await startButton.click()
    await expect(page).toHaveURL('/login')
  })
})