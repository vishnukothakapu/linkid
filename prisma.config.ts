import "dotenv/config";

const directUrl = process.env.DIRECT_URL?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

const url = directUrl || databaseUrl;

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
    url,
  },
};

export default config;
