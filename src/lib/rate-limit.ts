// src/lib/rate-limit.ts
import { NextResponse } from "next/server";

interface BucketState {
    count: number;
    resetAt: number;
}

interface ConsumeOptions {
    key: string;
    limit: number;
    windowMs: number;
}

export interface RateLimitResult {
    ok: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

const buckets = new Map<string, BucketState>();

function consume({ key, limit, windowMs }: ConsumeOptions): RateLimitResult {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
        const resetAt = now + windowMs;
        buckets.set(key, { count: 1, resetAt });
        return {
            ok: true,
            limit,
            remaining: Math.max(0, limit - 1),
            reset: resetAt,
        };
    }

    if (existing.count >= limit) {
        return {
            ok: false,
            limit,
            remaining: 0,
            reset: existing.resetAt,
        };
    }

    existing.count += 1;
    return {
        ok: true,
        limit,
        remaining: Math.max(0, limit - existing.count),
        reset: existing.resetAt,
    };
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const retryAfterSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
    return {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
        "X-RateLimit-Reset": String(Math.floor(result.reset / 1000)),
    };
}

export function applyRateLimitHeaders(
    response: Response,
    result?: RateLimitResult | null,
): Response {
    if (!result) return response;
    const headers = createRateLimitHeaders(result);
    Object.entries(headers).forEach(([header, value]) => {
        response.headers.set(header, value);
    });
    return response;
}

export class RateLimitError extends Error {
    public readonly status = 429;
    public readonly headers: Record<string, string>;

    constructor(message: string, result: RateLimitResult) {
        super(message);
        this.name = "RateLimitError";
        this.headers = createRateLimitHeaders(result);
    }
}

interface AssertOptions extends ConsumeOptions {
    message?: string;
}

export function assertRateLimit({ key, limit, windowMs, message }: AssertOptions): RateLimitResult {
    const result = consume({ key, limit, windowMs });
    if (!result.ok) {
        throw new RateLimitError(
            message ?? "Too many requests. Please try again later.",
            result,
        );
    }
    return result;
}

type RequestLike = Pick<Request, "headers"> | { headers: Headers };

export function getClientIp(req: RequestLike): string {
    const headers = req.headers;
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
        const [first] = forwarded.split(",");
        if (first?.trim()) return first.trim();
    }

    const realIp = headers.get("x-real-ip") || headers.get("cf-connecting-ip");
    if (realIp) return realIp;

    return "unknown";
}

interface WithRateLimitConfig extends Omit<AssertOptions, "key"> {
    keyGenerator?: (req: Request, ctx: unknown) => string;
    message?: string;
}

type RouteHandler = (req: Request, ctx: unknown) => Response | Promise<Response>;

export function withRateLimit(
    handler: RouteHandler,
    { keyGenerator, limit, windowMs, message }: WithRateLimitConfig,
): RouteHandler {
    return async (req: Request, ctx: unknown) => {
        const key = keyGenerator ? keyGenerator(req, ctx) : `rl:${getClientIp(req)}`;
        try {
            const result = assertRateLimit({ key, limit, windowMs, message });
            const response = await handler(req, ctx);
            if (!response.headers.has("X-RateLimit-Limit")) {
                applyRateLimitHeaders(response, result);
            }
            return response;
        } catch (error) {
            if (error instanceof RateLimitError) {
                const res = NextResponse.json(
                    { error: error.message },
                    { status: error.status, headers: error.headers },
                );
                return res;
            }
            throw error;
        }
    };
}

export function hitRateLimit(options: ConsumeOptions): RateLimitResult {
    return consume(options);
}
