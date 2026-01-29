import { test, expect } from './helpers/auth';

test.describe('유통사 흐름', () => {
  test('대시보드에서 통계 카드를 확인할 수 있다', async ({ distributorPage: page }) => {
    await page.goto('/distributor/dashboard');
    await expect(page.locator('text=대시보드')).toBeVisible();
    await expect(page.locator('text=총 제품')).toBeVisible();
  });

  test('입고/재고 현황을 확인할 수 있다', async ({ distributorPage: page }) => {
    await page.goto('/distributor/inventory');
    await expect(page.locator('text=입고/재고 현황')).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('재출고 페이지에 접근할 수 있다', async ({ distributorPage: page }) => {
    await page.goto('/distributor/shipment');
    await expect(page.locator('text=재출고')).toBeVisible();
  });

  test('반품 관리 페이지에 접근할 수 있다', async ({ distributorPage: page }) => {
    await page.goto('/distributor/returns');
    await expect(page.locator('text=반품 관리')).toBeVisible();
    await expect(page.locator('text=반품 등록')).toBeVisible();
  });

  test('설정 페이지에 접근할 수 있다', async ({ distributorPage: page }) => {
    await page.goto('/distributor/settings');
    await expect(page.locator('text=유통사 설정')).toBeVisible();
  });
});
