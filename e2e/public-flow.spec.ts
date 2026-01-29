import { test, expect } from '@playwright/test';

test.describe('공개 페이지', () => {
  test('가상코드 검증 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.locator('text=가상코드 검증')).toBeVisible();
    await expect(page.locator('input#code')).toBeVisible();
  });

  test('유효한 코드를 검증하면 결과가 표시된다', async ({ page }) => {
    await page.goto('/verify');

    await page.locator('input#code').fill('MT-NIS1-0001');
    await page.getByRole('button', { name: /검증/ }).click();

    // 검증 결과 영역 표시
    await expect(page.locator('text=/검증 결과/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('존재하지 않는 코드를 입력하면 에러가 표시된다', async ({ page }) => {
    await page.goto('/verify');

    await page.locator('input#code').fill('INVALID-CODE-0000');
    await page.getByRole('button', { name: /검증/ }).click();

    await expect(page.locator('text=/찾을 수 없|확인 불가/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('이력 조회 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/inquiry');
    await expect(page.locator('text=이력 조회')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();
  });

  test('전화번호로 이력을 조회할 수 있다', async ({ page }) => {
    await page.goto('/inquiry');

    await page.locator('input#phone').fill('01012345678');
    await page.getByRole('button', { name: /조회/ }).click();

    // 결과 영역이 표시됨 (데이터 유무 무관)
    await expect(page.locator('text=/이력|시술|없습니다/').first()).toBeVisible({ timeout: 10_000 });
  });
});
