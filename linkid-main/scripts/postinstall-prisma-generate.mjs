
import "dotenv/config";
import { execSync } from "node:child_process";

const hasDbUrl = Boolean(
  process.env.DATABASE_URL?.trim() ||
  process.env.DIRECT_URL?.trim()
);

if (!hasDbUrl) {
  console.log(
    "[postinstall] Skipping `prisma generate` (DATABASE_URL/DIRECT_URL not set)."
  );
} else {
  try {
    execSync("npx prisma generate", {
      stdio: "inherit",
      env: process.env,
    });
  } catch (error) {
    console.warn(
      "[postinstall] `prisma generate` failed; continuing install.",
      error instanceof Error ? error.message : String(error)
    );
  }
}
