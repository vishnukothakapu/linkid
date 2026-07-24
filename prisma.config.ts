// prisma.config.ts

import 'dotenv/config';
// prisma.config.ts
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "Missing database connection string. Set DATABASE_URL (preferred) or DIRECT_URL.",
  );
}

const config = {
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
};

export default config;
