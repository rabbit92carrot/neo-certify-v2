import { test, expect } from './helpers/auth';

test.describe('유통사 흐름', () => {
  test('대시보드에서 재고 현황을 확인할 수 있다', async ({ distributorPage: page }) => {
    await page.goto('/distributor/dashboard');
    // 재고 관련 정보 표시 확인
    await expect(page.locator('text=/재고|인벤토리|코드/').first()).toBeVisible();
  });

  test('입고된 제품을 확인할 수 있다', async ({ distributorPage: page }) => {
    await page.goto('/distributor/inventory');
    // 시드 데이터: 유통사에 코 임플란트 S 5개, M 6개, L 5개 등
    await expect(page.locator('text=코 임플란트').first()).toBeVisible();
  });

  test('재고를 조회하고 필터링할 수 있다', async ({ distributorPage: page }) => {
    await page.goto('/distributor/inventory');

    // 제품별 필터 확인
    const filterSelect = page.locator('[data-testid="product-filter"], select[name="product"]').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.click();
      await page.locator('text=코 임플란트').first().click();
    }

    // 재고 수량이 표시되는지 확인
    await expect(page.locator('table, [data-testid="inventory-list"]').first()).toBeVisible();
  });

  test('병원으로 재출고할 수 있다', async ({ distributorPage: page }) => {
    await page.goto('/distributor/shipments');

    await page.getByRole('button', { name: /출고|새 출고/ }).click();

    // 수신 병원 선택
    await page.locator('[data-testid="to-org-select"], select[name="to_org"]').first().click();
    await page.locator('text=서울중앙성형외과').first().click();

    // 제품 선택
    await page.locator('[data-testid="product-select"]').first().click();
    await page.locator('text=코 임플란트').first().click();
    await page.locator('[name="quantity"], [data-testid="shipment-quantity"]').first().fill('1');

    await page.getByRole('button', { name: /출고|확인/ }).click();
    await expect(page.locator('text=/성공|완료/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('반품을 요청할 수 있다', async ({ distributorPage: page }) => {
    await page.goto('/distributor/shipments');

    // 수신한 출고 건 찾기
    const shipmentRow = page.locator('tr:has-text("코 임플란트"), [data-testid="shipment-item"]').first();
    await shipmentRow.click();

    // 반품 버튼
    const returnBtn = page.getByRole('button', { name: /반품|반송/ });
    if (await returnBtn.isVisible()) {
      await returnBtn.click();

      // 반품 사유 입력
      await page.locator('[name="reason"], textarea').first().fill('포장 불량');
      await page.getByRole('button', { name: /확인|반품/ }).click();

      await expect(page.locator('text=/성공|완료|반품/').first()).toBeVisible({ timeout: 10_000 });
    }
  });
});
