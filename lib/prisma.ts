import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

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


