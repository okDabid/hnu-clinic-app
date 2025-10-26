import { NextResponse, type NextRequest } from "next/server";

export type RateLimitedRequest = Request | NextRequest;

interface RateLimitResult {
    success: boolean;
    retryAfterMs?: number;
}

interface Bucket {
    count: number;
    expiresAt: number;
}

class MemoryRateLimiter {
    private buckets: Map<string, Bucket> = new Map();
    private lastCleanup = 0;
    private readonly cleanupIntervalMs = 60_000; // 1 minute

    consume(key: string, limit: number, windowMs: number): RateLimitResult {
        const now = Date.now();
        this.cleanup(now);
        const bucket = this.buckets.get(key);

        if (!bucket || bucket.expiresAt <= now) {
            this.buckets.set(key, { count: 1, expiresAt: now + windowMs });
            return { success: true };
        }

        if (bucket.count < limit) {
            bucket.count += 1;
            return { success: true };
        }

        return { success: false, retryAfterMs: Math.max(0, bucket.expiresAt - now) };
    }

    private cleanup(now: number) {
        if (now - this.lastCleanup < this.cleanupIntervalMs) {
            return;
        }

        this.lastCleanup = now;
        for (const [key, bucket] of this.buckets) {
            if (bucket.expiresAt <= now) {
                this.buckets.delete(key);
            }
        }
    }
}

const globalKey = Symbol.for("hnu.rateLimiter");
const globalObject = globalThis as typeof globalThis & { [globalKey]?: MemoryRateLimiter };

if (!globalObject[globalKey]) {
    globalObject[globalKey] = new MemoryRateLimiter();
}

const limiter = globalObject[globalKey];

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

            const result = limiter.consume(key, rule.limit, rule.windowMs);
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

