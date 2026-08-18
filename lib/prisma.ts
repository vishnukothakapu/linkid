import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
    return new PrismaClient({ adapter });
};

declare global {
    var prismaGlobal: PrismaClient | undefined;
}

const prisma: PrismaClient = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = prisma;
}

export default prisma;
export { prisma };


