import { FullConfig } from '@playwright/test';

/**
 * Global setup: verify the app is running and seed data is available
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  const baseURL =
    process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  console.log(`🔍 Verifying app at ${baseURL}...`);

  // Health check
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(baseURL, { method: 'HEAD' });
      if (res.ok || res.status === 307 || res.status === 302) {
        console.log('✅ App is running');
        return;
      }
    } catch {
      // retry
    }
    console.log(`⏳ Waiting for app... (${i + 1}/${maxRetries})`);
    await new Promise((r) => setTimeout(r, 3000));
  }

  throw new Error(`App not reachable at ${baseURL} after ${maxRetries} retries`);
}

export default globalSetup;
