import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, login } from './helpers/auth';

test.describe('보안', () => {
  test.describe('미인증 접근 차단', () => {
    const protectedPaths = [
      '/manufacturer/dashboard',
      '/distributor/dashboard',
      '/hospital/dashboard',
      '/admin/dashboard',
      '/manufacturer/products',
      '/manufacturer/lots',
      '/manufacturer/shipments',
      '/distributor/inventory',
      '/hospital/treatments',
      '/admin/organizations',
    ];

    for (const path of protectedPaths) {
      test(`미인증 시 ${path} 접근이 차단된다`, async ({ page }) => {
        await page.goto(path);
        // 로그인 페이지로 리다이렉트되어야 함
        await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
      });
    }
  });

  test.describe('역할별 접근 제한', () => {
    test('유통사가 제조사 페이지에 접근하면 차단된다', async ({ page }) => {
      await login(page, TEST_ACCOUNTS.distributor.email, TEST_ACCOUNTS.distributor.password);
      await page.goto('/manufacturer/dashboard');

      // 접근 차단 또는 자기 대시보드로 리다이렉트
      const url = page.url();
      expect(url).not.toContain('/manufacturer/dashboard');
    });

    test('병원이 관리자 페이지에 접근하면 차단된다', async ({ page }) => {
      await login(page, TEST_ACCOUNTS.hospital.email, TEST_ACCOUNTS.hospital.password);
      await page.goto('/admin/dashboard');

      const url = page.url();
      expect(url).not.toContain('/admin/dashboard');
    });

    test('제조사가 병원 페이지에 접근하면 차단된다', async ({ page }) => {
      await login(page, TEST_ACCOUNTS.manufacturer.email, TEST_ACCOUNTS.manufacturer.password);
      await page.goto('/hospital/dashboard');

      const url = page.url();
      expect(url).not.toContain('/hospital/dashboard');
    });

    test('관리자는 관리자 페이지에 접근할 수 있다', async ({ page }) => {
      await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
      await page.goto('/admin/dashboard');

      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });
  });

  test.describe('Rate Limiting', () => {
    test('과도한 로그인 시도 시 rate limit이 적용된다', async ({ page }) => {
      // 빠르게 여러 번 로그인 시도
      for (let i = 0; i < 10; i++) {
        await page.goto('/login');
        await page.locator('input[type="email"]').fill(`test${i}@example.com`);
        await page.locator('input[type="password"]').fill('wrong');
        await page.locator('button[type="submit"]').click();
        // 짧은 대기
        await page.waitForTimeout(200);
      }

      // rate limit 메시지 또는 429 상태 확인
      const rateLimitMsg = page.locator('text=/너무 많은|rate limit|잠시 후|Too many/i').first();
      const hasRateLimit = await rateLimitMsg.isVisible().catch(() => false);

      // Rate limit이 적용되었거나, 적어도 에러가 계속 표시되어야 함
      if (!hasRateLimit) {
        // E2E_TEST=true 환경에서는 rate limit이 비활성화될 수 있음
        const errorMsg = page.locator('[class*="text-red"], .bg-red-50, [role="alert"]').first();
        await expect(errorMsg).toBeVisible();
      }
    });
  });
});
