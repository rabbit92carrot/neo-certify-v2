import { test, expect } from './helpers/auth';

test.describe('관리자 흐름', () => {
  test('대시보드에 조직 목록이 표시된다', async ({ adminPage: page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('text=/조직|Organizations/').first()).toBeVisible();
  });

  test('조직 목록을 조회할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/organizations');
    // 시드 데이터: 5개 조직
    await expect(page.locator('text=메디텍코리아').first()).toBeVisible();
    await expect(page.locator('text=한국메디컬서플라이').first()).toBeVisible();
    await expect(page.locator('text=서울중앙성형외과').first()).toBeVisible();
  });

  test('조직 상세 정보를 확인할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/organizations');

    await page.locator('text=메디텍코리아').first().click();
    // 조직 상세 페이지
    await expect(page.locator('text=MANUFACTURER').first()).toBeVisible();
    await expect(page.locator('text=이제조').first()).toBeVisible();
  });

  test('이력을 조회할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/histories');
    // 시드 데이터: 다양한 이력
    await expect(page.locator('table, [data-testid="history-list"]').first()).toBeVisible();
  });

  test('가상코드를 검증할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/verification');

    // 코드 입력
    await page.locator('[name="code"], [data-testid="verification-code"]').first().fill('MT-NIS1-0001');
    await page.getByRole('button', { name: /검증|조회|확인/ }).click();

    // 결과 확인
    await expect(page.locator('text=/코 임플란트|결과|정보/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('알림톡 미리보기를 확인할 수 있다', async ({ adminPage: page }) => {
    await page.goto('/admin/notifications');
    // 알림톡 관련 페이지 존재 확인
    await expect(page.locator('text=/알림|Notification|메시지/').first()).toBeVisible();
  });
});
