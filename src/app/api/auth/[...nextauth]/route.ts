// src/app/api/auth/[...nextauth]/route.ts

export const runtime = "nodejs";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { formFieldKey, ipKey, withRateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = withRateLimit(
    [
        {
            key: ipKey("auth:credentials:ip"),
            limit: 10,
            windowMs: 60_000,
            message: "Too many login attempts from this IP. Please try again soon.",
        },
        {
            key: async (request) => {
                const baseKey = await formFieldKey("id", "auth:credentials:id")(request);
                if (!baseKey) return null;
                try {
                    const cloned = request.clone();
                    const form = await cloned.formData();
                    const role = form.get("role");
                    const roleKey = typeof role === "string" && role
                        ? role.toUpperCase()
                        : "UNKNOWN";
                    return `${baseKey}:${roleKey}`;
                } catch (error) {
                    console.warn("Failed to read credentials role for rate limiting", error);
                    return baseKey;
                }
            },
            limit: 5,
            windowMs: 60_000,
            message: "Too many attempts for this account. Please wait a minute before retrying.",
        },
    ],
    handler
);
