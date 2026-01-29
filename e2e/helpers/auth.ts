import { test as base, Page, expect } from '@playwright/test';

/**
 * Test accounts matching seed.sql
 */
export const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@neocert.com',
    password: 'admin123',
    dashboardUrl: '/admin/dashboard',
  },
  manufacturer: {
    email: 'meditech@neocert.com',
    password: 'test1234',
    dashboardUrl: '/manufacturer/dashboard',
  },
  distributor: {
    email: 'supply@neocert.com',
    password: 'test1234',
    dashboardUrl: '/distributor/dashboard',
  },
  hospital: {
    email: 'seoul-ps@neocert.com',
    password: 'test1234',
    dashboardUrl: '/hospital/dashboard',
  },
  hospital2: {
    email: 'gangnam@neocert.com',
    password: 'test1234',
    dashboardUrl: '/hospital/dashboard',
  },
} as const;

export type UserRole = keyof typeof TEST_ACCOUNTS;

/**
 * Hide Next.js dev overlay that intercepts clicks
 */
export async function hideNextJsDevOverlay(page: Page): Promise<void> {
  await page.addStyleTag({
    content: 'nextjs-portal { display: none !important; }',
  });
}

/**
 * Login to the application
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

/**
 * Login with a specific role
 */
export async function loginAs(page: Page, role: UserRole): Promise<void> {
  const account = TEST_ACCOUNTS[role];
  await login(page, account.email, account.password);
}

/**
 * Logout from the application
 */
export async function logout(page: Page): Promise<void> {
  const logoutBtn = page.getByRole('button', { name: /로그아웃/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  } else {
    const userMenu = page.locator('[data-testid="user-menu"]');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByText('로그아웃').click();
    }
  }
  await page.waitForURL(/\/login/, { timeout: 10_000 });
}

/**
 * Extended test fixtures with pre-authenticated pages
 */
export const test = base.extend<{
  adminPage: Page;
  manufacturerPage: Page;
  distributorPage: Page;
  hospitalPage: Page;
  hospital2Page: Page;
}>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAs(page, 'admin');
    await use(page);
    await ctx.close();
  },
  manufacturerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAs(page, 'manufacturer');
    await use(page);
    await ctx.close();
  },
  distributorPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAs(page, 'distributor');
    await use(page);
    await ctx.close();
  },
  hospitalPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAs(page, 'hospital');
    await use(page);
    await ctx.close();
  },
  hospital2Page: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAs(page, 'hospital2');
    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
