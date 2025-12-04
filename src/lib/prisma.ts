// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;

const prismaClientSingleton = () => {
    const log = ["error", "warn"] as const; // keep logs lightweight in prod

    if (accelerateUrl) {
        return new PrismaClient({
            log,
            accelerateUrl,
        }).$extends(withAccelerate());
    }

    return new PrismaClient({
        log,
    });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
