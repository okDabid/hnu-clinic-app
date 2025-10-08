import { prisma } from "@/lib/prisma";

/**
 * Runs a Prisma op with a safe (re)connect if the socket was closed.
 * Retries once on known connection-closed errors.
 */
export async function withDb<T>(op: () => Promise<T>): Promise<T> {
    try {
        await prisma.$connect();            // ensure a live socket on cold start
        return await op();
    } catch (e: any) {
        const msg = String(e?.message || "");
        const code = e?.code;

        const isConnDrop =
            msg.includes("Server has closed the connection") ||
            code === "P1001" || // can't reach DB
            code === "P1009";   // database is not reachable / closed

        if (isConnDrop) {
            try { await prisma.$disconnect(); } catch { }
            await prisma.$connect();          // re-open socket
            return await op();                // retry once
        }
        throw e;
    }
}
