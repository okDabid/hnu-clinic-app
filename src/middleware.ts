import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { AccountStatus } from "@prisma/client";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // ✅ Allow all public and auth routes without token
    const publicPaths = [
        "/",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/verify-reset",
        "/api/auth",
        "/api/contact",
    ];

    if (publicPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // ✅ Extract session token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // ⛔️ No token → redirect to login page
    if (!token) {
        if (pathname.startsWith("/api")) {
            return NextResponse.json(
                { error: "Unauthorized: no session token" },
                { status: 401, headers: { "Cache-Control": "no-store" } }
            );
        }

        const res = NextResponse.redirect(new URL("/login", req.url));
        res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        return res;
    }

    const role = token.role as string | undefined;
    const status = token.status as AccountStatus | undefined;

    // 🚫 Block inactive users
    if (status === "Inactive") {
        if (pathname.startsWith("/api")) {
            return NextResponse.json(
                { error: "Account inactive. Contact admin." },
                { status: 403, headers: { "Cache-Control": "no-store" } }
            );
        }

        const res = NextResponse.redirect(new URL("/login?error=inactive", req.url));
        res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        return res;
    }

    // 🔐 Role-based route guards
    const roleGuardMap: Record<string, string> = {
        "/nurse": "NURSE",
        "/doctor": "DOCTOR",
        "/scholar": "SCHOLAR",
        "/patient": "PATIENT",
        "/admin": "ADMIN",
    };

    for (const prefix in roleGuardMap) {
        if (pathname.startsWith(prefix) && role !== roleGuardMap[prefix]) {
            if (pathname.startsWith("/api")) {
                return NextResponse.json(
                    { error: "Unauthorized: insufficient role" },
                    { status: 403, headers: { "Cache-Control": "no-store" } }
                );
            }

            const res = NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
            res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
            return res;
        }
    }

    // ✅ Allow if all checks pass
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res;
}

// ✅ Apply only to protected routes
export const config = {
    matcher: [
        "/nurse/:path*",
        "/doctor/:path*",
        "/scholar/:path*",
        "/patient/:path*",
        "/admin/:path*",
        "/api/:path*", // secure API routes too
    ],
};
