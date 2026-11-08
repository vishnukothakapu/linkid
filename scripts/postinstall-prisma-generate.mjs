import "dotenv/config";
import { execSync } from "node:child_process";

const directUrl = process.env.DIRECT_URL?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

const hasDbUrl = Boolean(directUrl || databaseUrl);

if (!hasDbUrl) {
  console.log(
    "[postinstall] Skipping `prisma generate` (DATABASE_URL/DIRECT_URL not set).",
  );
  process.exit(0);
}

try {
  execSync("npx prisma generate", {
    stdio: "inherit",
    env: process.env,
  });
} catch {
  // Keep installs usable; builds should still run `prisma generate` explicitly.
  console.warn(
    "[postinstall] `prisma generate` failed; continuing install.",
  );
  process.exit(0);
}
