import { test, expect } from './helpers/auth';

test.describe('제조사 흐름', () => {
  test('제품 목록 페이지가 로드된다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/products');
    await expect(page.locator('h1', { hasText: '제품 관리' })).toBeVisible();
    // 시드 데이터에 제품이 있어야 함
    await expect(page.locator('table')).toBeVisible();
  });

  test('새 제품을 등록할 수 있다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/products/new');
    await expect(page.locator('h1', { hasText: '제품 등록' })).toBeVisible();

    // ProductForm 필드 (react-hook-form 기반)
    await page.getByLabel('제품명').fill('테스트 보형물 E2E');
    await page.getByLabel('UDI-DI').fill('MT-E2E-' + Date.now());
    await page.getByLabel('모델명').fill('MT-E2E-MODEL');

    await page.getByRole('button', { name: '등록' }).click();

    // 성공 시 제품 목록으로 리다이렉트
    await page.waitForURL(/\/manufacturer\/products$/, { timeout: 15_000 });
    await expect(page.locator('text=테스트 보형물 E2E').first()).toBeVisible();
  });

  test('제품 상세 페이지를 볼 수 있다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/products');

    // 첫 번째 제품 클릭
    const firstProductLink = page.locator('table a').first();
    await firstProductLink.click();

    // 상세 페이지 확인
    await expect(page.locator('text=제품 정보')).toBeVisible();
    await expect(page.locator('text=UDI-DI')).toBeVisible();
  });

  test('Lot을 생성할 수 있다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/production');
    await expect(page.locator('h1', { hasText: '생산 관리' })).toBeVisible();

    // 제품 선택 (Select 컴포넌트)
    await page.locator('button[role="combobox"]').first().click();
    await page.locator('[role="option"]').first().click();

    // Lot 정보 입력
    const lotNumber = 'LOT-E2E-' + Date.now();
    await page.locator('#lotNumber').fill(lotNumber);
    await page.locator('#quantity').fill('5');

    const today = new Date().toISOString().split('T')[0]!;
    const future = new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
    await page.locator('#manufactureDate').fill(today);
    await page.locator('#expiryDate').fill(future);

    await page.getByRole('button', { name: /Lot 생성/ }).click();

    // 성공 토스트 확인
    await expect(page.locator('text=/Lot이 생성되었습니다/').first()).toBeVisible({ timeout: 15_000 });
  });

  test('출고 관리 페이지가 로드된다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/shipment');
    await expect(page.locator('h1', { hasText: '출고 관리' })).toBeVisible();
    await expect(page.locator('text=출고 등록')).toBeVisible();
  });

  test('재고 현황 페이지가 로드된다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/inventory');
    await expect(page.locator('h1', { hasText: '재고 현황' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});
