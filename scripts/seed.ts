#!/usr/bin/env npx tsx
/**
 * Seed execution script
 * Runs seed.sql against Supabase local dev or remote instance
 *
 * Usage:
 *   npx tsx scripts/seed.ts          # uses SUPABASE_DB_URL or defaults to local
 *   npx tsx scripts/seed.ts --reset  # reset DB before seeding
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const SEED_SQL_PATH = resolve(__dirname, '../supabase/seed.sql');

function main(): void {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');

  console.log('🌱 Neo-Certify v2 Seed Runner');
  console.log('─'.repeat(40));

  // Check if supabase CLI is available
  try {
    execSync('npx supabase --version', { stdio: 'pipe' });
  } catch {
    console.error('❌ Supabase CLI not found. Install with: npm i -D supabase');
    process.exit(1);
  }

  if (shouldReset) {
    console.log('🔄 Resetting database...');
    try {
      execSync('npx supabase db reset', {
        stdio: 'inherit',
        cwd: resolve(__dirname, '..'),
      });
      console.log('✅ Database reset complete (seed.sql applied via reset)');
      return;
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      process.exit(1);
    }
  }

  // Read and execute seed SQL
  const seedSql = readFileSync(SEED_SQL_PATH, 'utf-8');
  console.log(`📄 Seed file: ${SEED_SQL_PATH}`);
  console.log(`📊 SQL size: ${(seedSql.length / 1024).toFixed(1)} KB`);

  const dbUrl =
    process.env.SUPABASE_DB_URL ||
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

  console.log(`🔌 Connecting to: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  try {
    execSync(`psql "${dbUrl}" -f "${SEED_SQL_PATH}"`, {
      stdio: 'inherit',
      env: { ...process.env },
    });
    console.log('✅ Seed data inserted successfully!');
  } catch (error) {
    console.error('❌ Seed execution failed:', error);
    process.exit(1);
  }
}

main();
