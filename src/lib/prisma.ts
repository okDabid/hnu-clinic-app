// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in the environment");
}

const globalForPrisma = global as unknown as {
    prisma?: PrismaClient;
    pgPool?: Pool;
};

const pgPool =
    globalForPrisma.pgPool ??
    new Pool({
        connectionString: process.env.DATABASE_URL,
    });

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ["error", "warn"], // keep logs lightweight in prod
        adapter: new PrismaPg(pgPool),
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pgPool;
    globalForPrisma.prisma = prisma;
}
