// src/lib/prisma.ts
import { Prisma, PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
const datasourceUrl = process.env.DATABASE_URL;

// Avoid Prisma defaulting to the client engine (Data Proxy) when no adapter is
// configured. The native/library engine works in the current Node environment.
if (!accelerateUrl && !process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

const prismaClientSingleton = () => {
    const log: (Prisma.LogLevel | Prisma.LogDefinition)[] = ["error", "warn"]; // keep logs lightweight in prod

    if (accelerateUrl) {
        const clientOptions: Prisma.PrismaClientOptions = {
            log,
            accelerateUrl,
            ...(datasourceUrl && { datasourceUrl }),
        };
        return new PrismaClient(clientOptions).$extends(withAccelerate());
    }

    // Explicitly use the native engine when Accelerate is not configured to avoid
    // Prisma defaulting to the client engine, which requires a data proxy/adapter.
    const clientOptions: Prisma.PrismaClientOptions = {
        log,
        ...(datasourceUrl && { datasources: { db: { url: datasourceUrl } } }),
    };
    return new PrismaClient(clientOptions);
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;