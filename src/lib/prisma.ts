// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
}

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasourceUrl: databaseUrl,
        log: ["error", "warn"], // keep logs lightweight in prod
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
