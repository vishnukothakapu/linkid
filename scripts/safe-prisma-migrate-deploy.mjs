import { execSync } from 'node:child_process';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!databaseUrl) {
  console.log('[safe-migrate] DATABASE_URL not set — skipping migrations.');
  process.exit(0);
}

(async () => {
  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('[safe-migrate] Connected to database — running migrations.');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('[safe-migrate] Migrations completed.');
  } catch (err) {
    console.warn('[safe-migrate] Could not connect to database or migrations failed:', err.message || err);
    console.log('[safe-migrate] Skipping migrations to avoid hard failure.');
    process.exit(0);
  } finally {
    try { await client.end(); } catch {}
  }
})();
