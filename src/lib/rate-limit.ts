import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export type RequestLike = Request | NextRequest;

export interface RateLimiterOptions {
    /** Maximum number of requests allowed per window */
    limit: number;
    /** Length of the rolling window in milliseconds */
    windowMs: number;
    /** Optional prefix to keep buckets distinct */
    keyPrefix?: string;
}

interface RateLimitBucket {
    count: number;
    resetAt: number;
}

export interface RateLimitOk {
    success: true;
    remaining: number;
    reset: number;
}

export interface RateLimitExceeded {
    success: false;
    remaining: 0;
    reset: number;
    retryAfter: number;
}

export type RateLimitResult = RateLimitOk | RateLimitExceeded;

function getClientIp(req: RequestLike): string | null {
    const nextReq = req as NextRequest;

    if (typeof nextReq.ip === "string" && nextReq.ip) {
        return nextReq.ip;
    }

    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        const firstIp = forwarded.split(",")[0]?.trim();
        if (firstIp) {
            return firstIp;
        }
    }

    const realIp = req.headers.get("x-real-ip");
    if (realIp) {
        return realIp;
    }

    return null;
}

function formatKey(prefix: string | undefined, identifier: string) {
    const safeId = identifier || "anonymous";
    return prefix ? `${prefix}:${safeId}` : safeId;
}

export function createRateLimiter(options: RateLimiterOptions) {
    const buckets = new Map<string, RateLimitBucket>();

    async function checkInternal(identifier: string): Promise<RateLimitResult> {
        const now = Date.now();
        const key = formatKey(options.keyPrefix, identifier);
        const bucket = buckets.get(key);

        if (!bucket || bucket.resetAt <= now) {
            const resetAt = now + options.windowMs;
            buckets.set(key, { count: 1, resetAt });
            return {
                success: true,
                remaining: Math.max(0, options.limit - 1),
                reset: resetAt,
            };
        }

        if (bucket.count >= options.limit) {
            return {
                success: false,
                remaining: 0,
                reset: bucket.resetAt,
                retryAfter: Math.max(0, bucket.resetAt - now),
            };
        }

        bucket.count += 1;
        return {
            success: true,
            remaining: Math.max(0, options.limit - bucket.count),
            reset: bucket.resetAt,
        };
    }

    return {
        options,
        check: checkInternal,
        checkRequest(req: RequestLike, overrideIdentifier?: string) {
            const identifier = overrideIdentifier ?? getClientIp(req) ?? "anonymous";
            return checkInternal(identifier);
        },
        identifierFromRequest(req: RequestLike) {
            return getClientIp(req) ?? "anonymous";
        },
    };
}

export function isRateLimited(
    result: RateLimitResult
): result is RateLimitExceeded {
    return result.success === false;
}

export function rateLimitResponse(
    result: RateLimitExceeded,
    message: string
) {
    const retryAfterSeconds = Math.max(1, Math.ceil(result.retryAfter / 1000));
    return NextResponse.json(
        {
            error: message,
            retryAfter: retryAfterSeconds,
        },
        {
            status: 429,
            headers: {
                "Retry-After": String(retryAfterSeconds),
            },
        }
    );
}
