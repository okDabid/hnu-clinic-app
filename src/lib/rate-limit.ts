import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RateLimitedRequest = Request | NextRequest;

export interface RateLimitResult {
    success: boolean;
    retryAfterMs?: number;
}

interface RateLimiter {
    consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

interface Bucket {
    count: number;
    expiresAt: number;
}

interface ExpirationEntry {
    key: string;
    expiresAt: number;
}

class MemoryRateLimiter implements RateLimiter {
    private buckets: Map<string, Bucket> = new Map();
    private expirations: ExpirationEntry[] = [];

    async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
        const now = Date.now();
        this.cleanup(now);
        const bucket = this.buckets.get(key);

        if (!bucket || bucket.expiresAt <= now) {
            const expiresAt = now + windowMs;
            this.buckets.set(key, { count: 1, expiresAt });
            this.scheduleExpiration({ key, expiresAt });
            return { success: true };
        }

        if (bucket.count < limit) {
            bucket.count += 1;
            return { success: true };
        }

        return { success: false, retryAfterMs: Math.max(0, bucket.expiresAt - now) };
    }

    private cleanup(now: number) {
        while (this.expirations.length > 0) {
            const next = this.expirations[0];
            if (next.expiresAt > now) {
                break;
            }

            const expired = this.popExpiration();
            const bucket = this.buckets.get(expired.key);
            if (!bucket) {
                continue;
            }

            if (bucket.expiresAt <= now && bucket.expiresAt === expired.expiresAt) {
                this.buckets.delete(expired.key);
            }
        }
    }

    private scheduleExpiration(entry: ExpirationEntry) {
        this.expirations.push(entry);
        this.heapBubbleUp(this.expirations.length - 1);
    }

    private popExpiration(): ExpirationEntry {
        const first = this.expirations[0]!;
        const last = this.expirations.pop()!;

        if (this.expirations.length === 0) {
            return first;
        }

        this.expirations[0] = last;
        this.heapSinkDown(0);
        return first;
    }

    private heapBubbleUp(index: number) {
        const entry = this.expirations[index];

        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            const parent = this.expirations[parentIndex];
            if (parent.expiresAt <= entry.expiresAt) {
                break;
            }

            this.expirations[index] = parent;
            index = parentIndex;
        }

        this.expirations[index] = entry;
    }

    private heapSinkDown(index: number) {
        const length = this.expirations.length;
        const entry = this.expirations[index];

        while (true) {
            const leftIndex = index * 2 + 1;
            if (leftIndex >= length) {
                break;
            }

            let smallestIndex = leftIndex;
            const rightIndex = leftIndex + 1;

            if (
                rightIndex < length &&
                this.expirations[rightIndex].expiresAt < this.expirations[leftIndex].expiresAt
            ) {
                smallestIndex = rightIndex;
            }

            if (this.expirations[smallestIndex].expiresAt >= entry.expiresAt) {
                break;
            }

            this.expirations[index] = this.expirations[smallestIndex];
            index = smallestIndex;
        }

        this.expirations[index] = entry;
    }
}

class PrismaRateLimiter implements RateLimiter {
    async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
        const now = new Date();
        const windowStartMs = Math.floor(now.getTime() / windowMs) * windowMs;
        const windowStart = new Date(windowStartMs);
        const windowEndMs = windowStartMs + windowMs;

        try {
            const bucket = await prisma.$transaction(
                async (tx) =>
                    tx.rateLimitBucket.upsert({
                        where: { key_window_start: { key, window_start: windowStart } },
                        update: { count: { increment: 1 } },
                        create: { key, window_start: windowStart, count: 1 },
                    }),
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
            );

            const count = Number(bucket.count ?? 1);
            if (count === 1) {
                const cleanupThreshold = new Date(windowStartMs - windowMs * 24);
                void prisma.rateLimitBucket
                    .deleteMany({ where: { window_start: { lt: cleanupThreshold } } })
                    .catch((cleanupError) => {
                        console.warn(
                            "[RateLimit] Failed to prune expired rate limit buckets:",
                            cleanupError
                        );
                    });
            }
            if (count > limit) {
                return { success: false, retryAfterMs: Math.max(0, windowEndMs - now.getTime()) };
            }

            return { success: true };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
                return { success: false, retryAfterMs: Math.max(0, windowEndMs - now.getTime()) };
            }

            throw error;
        }
    }
}

const globalKey = Symbol.for("hnu.rateLimiter");
const globalObject = globalThis as typeof globalThis & { [globalKey]?: MemoryRateLimiter };

if (!globalObject[globalKey]) {
    globalObject[globalKey] = new MemoryRateLimiter();
}

const memoryLimiter = globalObject[globalKey];
const databaseLimiter = new PrismaRateLimiter();
let useMemoryFallback = process.env.RATE_LIMIT_DRIVER === "memory";
let fallbackLogged = false;

function logRateLimitFallback(error: unknown) {
    if (fallbackLogged) return;
    fallbackLogged = true;

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
        console.warn(
            "[RateLimit] RateLimitBucket table is unavailable or could not be created. Falling back to in-memory limiter."
        );
        return;
    }

    console.error(
        "[RateLimit] Failed to use database-backed limiter. Falling back to in-memory limiter.",
        error
    );
}

export async function consumeRateLimit(
    key: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult> {
    if (!useMemoryFallback) {
        try {
            return await databaseLimiter.consume(key, limit, windowMs);
        } catch (error) {
            logRateLimitFallback(error);
            useMemoryFallback = true;
        }
    }

    return memoryLimiter.consume(key, limit, windowMs);
}

export interface RateLimitRule {
    key?: (request: RateLimitedRequest) => Promise<string | null> | string | null;
    limit: number;
    windowMs: number;
    message?: string;
}

function defaultKey(request: RateLimitedRequest): string | null {
    const ip = getClientIp(request);
    return ip ? `ip:${ip}` : null;
}

export function withRateLimit<Args extends unknown[]>(
    rules: RateLimitRule[] | RateLimitRule,
    handler: (request: RateLimitedRequest, ...args: Args) => Promise<Response> | Response
): (request: RateLimitedRequest, ...args: Args) => Promise<Response> {
    const normalizedRules = Array.isArray(rules) ? rules : [rules];

    return async (request: RateLimitedRequest, ...args: Args) => {
        for (const rule of normalizedRules) {
            const key = await (rule.key ?? defaultKey)(request);
            if (!key) continue;

            const result = await consumeRateLimit(key, rule.limit, rule.windowMs);
            if (!result.success) {
                const retryAfterSeconds = result.retryAfterMs
                    ? Math.ceil(result.retryAfterMs / 1000)
                    : undefined;
                const response = NextResponse.json(
                    {
                        error: rule.message ?? "Too many requests. Please try again later.",
                    },
                    { status: 429 }
                );

                if (retryAfterSeconds) {
                    response.headers.set("Retry-After", retryAfterSeconds.toString());
                }

                return response;
            }
        }

        return handler(request, ...args);
    };
}

export function getClientIp(request: RateLimitedRequest): string | null {
    const nextReq = request as NextRequest & { ip?: string | null };
    if (typeof nextReq.ip === "string" && nextReq.ip.length > 0) {
        return nextReq.ip;
    }

    const header = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
    if (!header) return null;
    return header.split(",")[0]?.trim() || null;
}

export function ipKey(prefix: string): (request: RateLimitedRequest) => string | null {
    return (request) => {
        const ip = getClientIp(request);
        return ip ? `${prefix}:${ip}` : null;
    };
}

export function formFieldKey(
    field: string,
    prefix: string
): (request: RateLimitedRequest) => Promise<string | null> {
    return async (request) => {
        if (request.method !== "POST") return null;
        const cloned = request.clone();
        try {
            const form = await cloned.formData();
            const value = form.get(field);
            if (typeof value !== "string" || value.length === 0) return null;
            return `${prefix}:${value.toLowerCase()}`;
        } catch (error) {
            console.warn(`Failed to parse form data for field ${field}:`, error);
            return null;
        }
    };
}

export function jsonFieldKey(
    field: string,
    prefix: string
): (request: RateLimitedRequest) => Promise<string | null> {
    return async (request) => {
        if (request.method !== "POST") return null;
        const cloned = request.clone();
        try {
            const body = await cloned.json();
            const value = body?.[field];
            if (typeof value !== "string" || value.length === 0) return null;
            return `${prefix}:${value.toLowerCase()}`;
        } catch (error) {
            console.warn(`Failed to parse JSON body for field ${field}:`, error);
            return null;
        }
    };
}

