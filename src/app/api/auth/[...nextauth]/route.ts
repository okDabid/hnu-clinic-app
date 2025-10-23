// src/app/api/auth/[...nextauth]/route.ts

export const runtime = "nodejs";
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth";
import {
    createRateLimiter,
    isRateLimited,
    rateLimitResponse,
} from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

const authPostLimiter = createRateLimiter({
    limit: 5,
    windowMs: 60 * 1000,
    keyPrefix: "auth:post",
});

const authGetLimiter = createRateLimiter({
    limit: 30,
    windowMs: 60 * 1000,
    keyPrefix: "auth:get",
});

type NextAuthContext = {
    params: {
        nextauth: string[];
    };
};

export async function POST(req: NextRequest, context: NextAuthContext) {
    const rate = await authPostLimiter.checkRequest(req);
    if (isRateLimited(rate)) {
        return rateLimitResponse(
            rate,
            "Too many login attempts. Please try again in a moment."
        );
    }

    return handler(req, context);
}

export async function GET(req: NextRequest, context: NextAuthContext) {
    const rate = await authGetLimiter.checkRequest(req);
    if (isRateLimited(rate)) {
        return rateLimitResponse(
            rate,
            "Too many authentication requests. Please slow down."
        );
    }

    return handler(req, context);
}
