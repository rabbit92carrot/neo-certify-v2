import { test, expect } from './helpers/auth';

test.describe('병원 흐름', () => {
  test('대시보드에서 통계 카드를 확인할 수 있다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/dashboard');
    await expect(page.locator('h1', { hasText: '대시보드' })).toBeVisible();
    // StatCards rendered
    await expect(page.locator('text=총 제품').first()).toBeVisible();
    await expect(page.locator('text=재고').first()).toBeVisible();
  });

  test('재고 목록을 조회할 수 있다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/inventory');
    await expect(page.locator('h1', { hasText: '재고 현황' })).toBeVisible();
    // Table or empty state
    await expect(
      page.locator('table, text=재고가 없습니다').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('시술 등록 페이지가 렌더링된다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/treatment');
    await expect(page.locator('h1', { hasText: '시술 기록' })).toBeVisible({ timeout: 10_000 });
    // Form card
    await expect(page.locator('text=시술 등록').first()).toBeVisible();
  });

  test('시술 이력 페이지가 렌더링된다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/treatment-history');
    await expect(page.locator('h1', { hasText: '시술 이력' })).toBeVisible({ timeout: 10_000 });
    // Table headers
    await expect(page.locator('text=시술일').first()).toBeVisible();
  });

  test('회수 페이지가 렌더링된다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/recall');
    await expect(page.locator('h1', { hasText: '회수 관리' })).toBeVisible({ timeout: 10_000 });
  });

  test('폐기 등록 페이지가 렌더링된다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/disposal');
    await expect(page.locator('h1', { hasText: '폐기 관리' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=폐기 등록').first()).toBeVisible();
  });

  test('설정 페이지가 렌더링된다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/settings');
    await expect(page.locator('h1', { hasText: '병원 설정' })).toBeVisible({ timeout: 10_000 });
  });
});
