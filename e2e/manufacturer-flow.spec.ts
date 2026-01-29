import { test, expect } from './helpers/auth';

test.describe('제조사 흐름', () => {
  test('대시보드에서 제품 목록을 확인할 수 있다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/dashboard');
    // 대시보드 요소 확인
    await expect(page.locator('text=코 임플란트').first()).toBeVisible();
  });

  test('새 제품을 등록할 수 있다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/products');

    // 제품 등록 버튼 클릭
    await page.getByRole('button', { name: /제품 등록|새 제품|추가/ }).click();

    // 제품 정보 입력
    await page.locator('[name="name"], [data-testid="product-name"]').first().fill('테스트 보형물');
    await page.locator('[name="udi_di"], [data-testid="product-udi"]').first().fill('MT-TEST-001');
    await page.locator('[name="model_name"], [data-testid="product-model"]').first().fill('MT-T001');

    // 저장
    await page.getByRole('button', { name: /저장|등록|확인/ }).click();

    // 성공 확인
    await expect(page.locator('text=테스트 보형물').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Lot을 생성할 수 있다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/lots');

    await page.getByRole('button', { name: /Lot 생성|새 Lot|추가/ }).click();

    // 제품 선택
    await page.locator('[data-testid="product-select"], select[name="product_id"]').first().click();
    await page.locator('text=코 임플란트').first().click();

    // Lot 정보 입력
    await page.locator('[name="lot_number"], [data-testid="lot-number"]').first().fill('LOT-TEST-001');
    await page.locator('[name="quantity"], [data-testid="lot-quantity"]').first().fill('5');

    // 날짜 입력
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await page.locator('[name="manufacture_date"]').first().fill(today);
    await page.locator('[name="expiry_date"]').first().fill(futureDate);

    await page.getByRole('button', { name: /저장|생성|확인/ }).click();

    await expect(page.locator('text=LOT-TEST-001').first()).toBeVisible({ timeout: 10_000 });
  });

  test('가상코드를 생성할 수 있다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/lots');

    // 기존 Lot 선택하여 코드 생성
    await page.locator('text=LOT-NIS-2024-001').first().click();
    await page.getByRole('button', { name: /코드 생성|추가 생산|수량 추가/ }).click();

    await page.locator('[name="quantity"], [data-testid="additional-quantity"]').first().fill('3');
    await page.getByRole('button', { name: /생성|확인/ }).click();

    // 성공 메시지 확인
    await expect(page.locator('text=/성공|완료|생성/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('유통사로 출고할 수 있다', async ({ manufacturerPage: page }) => {
    await page.goto('/manufacturer/shipments');

    await page.getByRole('button', { name: /출고|새 출고/ }).click();

    // 수신 조직 선택
    await page.locator('[data-testid="to-org-select"], select[name="to_org"]').first().click();
    await page.locator('text=한국메디컬서플라이').first().click();

    // 제품/수량 선택
    await page.locator('[data-testid="product-select"]').first().click();
    await page.locator('text=코 임플란트').first().click();
    await page.locator('[name="quantity"], [data-testid="shipment-quantity"]').first().fill('2');

    await page.getByRole('button', { name: /출고|확인|전송/ }).click();

    await expect(page.locator('text=/성공|완료|출고/').first()).toBeVisible({ timeout: 10_000 });
  });
});
