import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, hideNextJsDevOverlay } from './helpers/auth';

test.describe('인증 흐름', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 페이지가 올바르게 렌더링된다', async ({ page }) => {
    await expect(page.locator('h2:has-text("로그인")').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('제조사 계정으로 로그인하면 제조사 대시보드로 이동한다', async ({ page }) => {
    const { email, password } = TEST_ACCOUNTS.manufacturer;
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/manufacturer\/dashboard/);
  });

  test('유통사 계정으로 로그인하면 유통사 대시보드로 이동한다', async ({ page }) => {
    const { email, password } = TEST_ACCOUNTS.distributor;
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/distributor\/dashboard/);
  });

  test('병원 계정으로 로그인하면 병원 대시보드로 이동한다', async ({ page }) => {
    const { email, password } = TEST_ACCOUNTS.hospital;
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/hospital\/dashboard/);
  });

  test('관리자 계정으로 로그인하면 관리자 대시보드로 이동한다', async ({ page }) => {
    const { email, password } = TEST_ACCOUNTS.admin;
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('잘못된 자격증명으로 로그인하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.locator('input[type="email"]').fill('wrong@email.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // 에러 메시지 확인
    const errorIndicator = page.locator('[class*="text-red"], .bg-red-50, [role="alert"]').first();
    await expect(errorIndicator).toBeVisible({ timeout: 10_000 });
  });

  test('회원가입 페이지로 이동할 수 있다', async ({ page }) => {
    await page.locator('a[href="/register"]').click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('로그아웃하면 로그인 페이지로 돌아간다', async ({ page }) => {
    // 먼저 로그인
    const { email, password } = TEST_ACCOUNTS.manufacturer;
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    await hideNextJsDevOverlay(page);

    // 로그아웃
    const logoutBtn = page.getByRole('button', { name: /로그아웃/i });
    const userMenu = page.locator('[data-testid="user-menu"]');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByText('로그아웃').click();
    }

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
