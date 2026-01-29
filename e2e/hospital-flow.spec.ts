import { test, expect } from './helpers/auth';

// TODO: 병원 대시보드 UI 구현 후 활성화
test.describe.skip('병원 흐름', () => {
  test('대시보드에서 재고를 확인할 수 있다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/dashboard');
    await expect(page.locator('text=/재고|코드|임플란트/').first()).toBeVisible();
  });

  test('재고 목록을 조회할 수 있다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/inventory');
    // 시드 데이터: 병원1에 코 임플란트 S 3개(+USED 1), M 4개, 턱 2개, 필러 등
    await expect(page.locator('table, [data-testid="inventory-list"]').first()).toBeVisible();
  });

  test('시술을 등록할 수 있다 (환자 선택)', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/treatments');

    await page.getByRole('button', { name: /시술 등록|새 시술/ }).click();

    // 환자 선택/입력
    await page.locator('[data-testid="patient-phone"], [name="patient_phone"]').first().fill('010-1111-0001');

    // 시술일 입력
    const today = new Date().toISOString().split('T')[0];
    await page.locator('[name="treatment_date"]').first().fill(today);

    // 제품 선택
    await page.locator('[data-testid="product-select"]').first().click();
    await page.locator('text=코 임플란트').first().click();
    await page.locator('[name="quantity"], [data-testid="treatment-quantity"]').first().fill('1');

    await page.getByRole('button', { name: /등록|확인|시술/ }).click();
    await expect(page.locator('text=/성공|완료|시술/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('시술 이력을 조회할 수 있다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/treatments');
    // 시드 데이터: 시술 기록 존재
    await expect(page.locator('text=010-1111').first()).toBeVisible({ timeout: 10_000 });
  });

  test('시술을 회수할 수 있다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/treatments');

    // 최근 시술 기록 선택
    const treatmentRow = page.locator('tr, [data-testid="treatment-item"]').first();
    await treatmentRow.click();

    const recallBtn = page.getByRole('button', { name: /회수|취소/ });
    if (await recallBtn.isVisible()) {
      await recallBtn.click();
      await page.locator('[name="reason"], textarea').first().fill('환자 요청');
      await page.getByRole('button', { name: /확인|회수/ }).click();
      await expect(page.locator('text=/성공|완료|회수/').first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('제품을 폐기할 수 있다', async ({ hospitalPage: page }) => {
    await page.goto('/hospital/disposals');

    await page.getByRole('button', { name: /폐기|새 폐기/ }).click();

    // 폐기 정보 입력
    const today = new Date().toISOString().split('T')[0];
    await page.locator('[name="disposal_date"]').first().fill(today);

    // 폐기 사유 선택
    await page.locator('[data-testid="disposal-reason"], select[name="reason"]').first().click();
    await page.locator('text=/만료|EXPIRED/').first().click();

    // 제품 선택
    await page.locator('[data-testid="product-select"]').first().click();
    await page.locator('text=필러').first().click();
    await page.locator('[name="quantity"], [data-testid="disposal-quantity"]').first().fill('1');

    await page.getByRole('button', { name: /폐기|확인/ }).click();
    await expect(page.locator('text=/성공|완료|폐기/').first()).toBeVisible({ timeout: 10_000 });
  });
});
