// src/lib/withDb.ts
import { prisma } from "@/lib/prisma";

/**
 * Runs a Prisma operation safely, reconnecting only when needed.
 * Avoids redundant $connect() calls to prevent cold-start delays.
 */
export async function withDb<T>(op: () => Promise<T>): Promise<T> {
    try {
        // Prisma auto-connects lazily, so no need to call $connect() every time
        return await op();
    } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        const msg = err.message ?? "";
        const code = (err as { code?: string }).code;

        const isConnDrop =
            msg.includes("Server has closed the connection") ||
            code === "P1001" || // can't reach DB
            code === "P1009";   // database not reachable

        if (isConnDrop) {
            console.warn("Prisma connection dropped — reconnecting...");
            try { await prisma.$disconnect(); } catch { }
            await prisma.$connect();
            return await op();
        }

        throw err;
    }
}
