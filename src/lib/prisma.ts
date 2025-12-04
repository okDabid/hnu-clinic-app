// src/lib/prisma.ts
import { Prisma, PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;

const prismaClientSingleton = () => {
    const log: (Prisma.LogLevel | Prisma.LogDefinition)[] = ["error", "warn"]; // keep logs lightweight in prod

    if (accelerateUrl) {
        return new PrismaClient({
            log,
        }).$extends(withAccelerate());
    }

    // Explicitly use the native engine when Accelerate is not configured to avoid
    // Prisma defaulting to the client engine, which requires a data proxy/adapter.
    return new PrismaClient({
        log,
    });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;