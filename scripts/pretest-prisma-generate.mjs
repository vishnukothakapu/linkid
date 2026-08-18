import { execSync } from "node:child_process";

// The test suite imports routes that pull in `@prisma/client`, so the client
// must be generated first. `prisma generate` does not connect to the database,
// but prisma.config.ts throws when no connection string is set (the fresh-clone
// default), which would block generation. Supply a harmless placeholder for the
// generate step only, so `npm test` works on a fresh clone with no DB env.
const env = { ...process.env };
if (!env.DATABASE_URL && !env.DIRECT_URL) {
  env.DATABASE_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";
}

execSync("npx prisma generate", { stdio: "inherit", env });
