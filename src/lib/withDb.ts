// src/lib/withDb.ts
import prisma from "@/lib/prisma";

/**
 * Runs a Prisma operation. 
 * In Prisma 6.19/7, the Driver Adapter (pg) manages the connection pool.
 * We no longer need to manually manage $connect/$disconnect cycles.
 */
export async function withDb<T>(op: () => Promise<T>): Promise<T> {
    try {
        return await op();
    } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        
        // Log the error for your clinic app's stability monitoring
        console.error("Database Operation Failed:", err.message);

        // If you still want a retry mechanism for specific transient errors:
        const code = (err as { code?: string }).code;
        const isTransient = code === "P1001" || code === "P1009";

        if (isTransient) {
            console.warn("Transient DB error detected. Retrying once...");
            return await op(); // Simple one-time retry
        }

        throw err;
    }
}