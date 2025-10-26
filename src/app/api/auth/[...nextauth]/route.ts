// src/app/api/auth/[...nextauth]/route.ts

export const runtime = "nodejs";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { withRateLimit, getClientIp } from "@/lib/rate-limit";

const baseHandler = NextAuth(authOptions);

const handler = withRateLimit(baseHandler, {
    limit: 60,
    windowMs: 60 * 1000,
    message: "Too many authentication requests from this IP. Please wait and try again.",
    keyGenerator: (req) => `auth:route:${getClientIp(req)}`,
});

export { handler as GET, handler as POST };