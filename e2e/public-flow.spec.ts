import { test, expect } from '@playwright/test';

test.describe('공개 페이지', () => {
  test('가상코드 검증 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.locator('input[name="code"], [data-testid="code-input"]').first()).toBeVisible();
  });

  test('유효한 코드를 검증하면 제품 정보가 표시된다', async ({ page }) => {
    await page.goto('/verify');

    await page.locator('input[name="code"], [data-testid="code-input"]').first().fill('MT-NIS1-0001');
    await page.getByRole('button', { name: /검증|확인|조회/ }).click();

    // 제품 정보 표시
    await expect(page.locator('text=/코 임플란트|제품|인증/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('사용된 코드를 검증하면 시술 이력이 표시된다', async ({ page }) => {
    await page.goto('/verify');

    // MT-NIS1-0011은 USED 상태 (환자1에게 시술됨)
    await page.locator('input[name="code"], [data-testid="code-input"]').first().fill('MT-NIS1-0011');
    await page.getByRole('button', { name: /검증|확인|조회/ }).click();

    await expect(page.locator('text=/사용|시술|USED/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('존재하지 않는 코드를 입력하면 에러가 표시된다', async ({ page }) => {
    await page.goto('/verify');

    await page.locator('input[name="code"], [data-testid="code-input"]').first().fill('INVALID-CODE-0000');
    await page.getByRole('button', { name: /검증|확인|조회/ }).click();

    await expect(page.locator('text=/찾을 수 없|존재하지|유효하지/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('이력 조회 페이지에서 코드 이력을 확인할 수 있다', async ({ page }) => {
    await page.goto('/verify/history');

    await page.locator('input[name="code"], [data-testid="code-input"]').first().fill('MT-NIS1-0011');
    await page.getByRole('button', { name: /조회|확인/ }).click();

    // 이력 타임라인 표시
    await expect(page.locator('text=/MANUFACTURED|제조|이력/').first()).toBeVisible({ timeout: 10_000 });
  });
});
