// src/lib/prisma.ts
import { Prisma, PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;

const prismaClientSingleton = () => {
    const log: Prisma.PrismaClientOptions["log"] = ["error", "warn"]; // keep logs lightweight in prod

    if (accelerateUrl) {
        return new PrismaClient({
            log,
            accelerateUrl,
        }).$extends(withAccelerate());
    }

    // Explicitly avoid the client engine (which needs an adapter/Accelerate) when
    // Accelerate is not configured by forcing Prisma to use the native library
    // engine via the environment variable expected by Prisma.
    if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
        process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
    }

    return new PrismaClient({
        log,
    });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
