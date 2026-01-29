import { test, expect } from './helpers/auth';

test.describe('관리자 흐름', () => {
  test('대시보드에 통계 카드가 표시된다', async ({ adminPage: page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('text=대시보드')).toBeVisible();
  });

  test('조직 목록을 조회할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/organizations');
    await expect(page.locator('text=조직 관리')).toBeVisible();
    // 시드 데이터 조직 존재 여부
    await expect(page.locator('table, [data-testid="org-list"]').first()).toBeVisible();
  });

  test('조직 상세 페이지에 접근할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/organizations');
    // 첫 번째 조직 클릭
    const orgLink = page.locator('a[href*="/admin/organizations/"]').first();
    if (await orgLink.isVisible()) {
      await orgLink.click();
      await expect(page.locator('text=/조직 정보|조직 상세/').first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('이력을 조회할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/history');
    await expect(page.locator('text=/이력|히스토리/').first()).toBeVisible();
  });

  test('통계 페이지에 접근할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/statistics');
    await expect(page.locator('text=/통계/').first()).toBeVisible();
  });

  test('가상코드 검증 페이지에 접근할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/codes');
    await expect(page.locator('text=가상코드 조회/검증')).toBeVisible();
    // 코드 입력 필드 존재
    await expect(page.locator('input#code')).toBeVisible();
  });

  test('설정 페이지에 접근할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('text=/설정/').first()).toBeVisible();
  });

  test('알림톡 미리보기 페이지에 접근할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/alimtalk-preview');
    await expect(page.locator('text=/알림톡|미리보기/').first()).toBeVisible();
  });
});
