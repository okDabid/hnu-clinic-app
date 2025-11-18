import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { isNurseBootstrapEnabled } from "@/lib/bootstrap-flag";

const PUBLIC_PATH_PREFIXES = new Set([
    "/login",
    "/forgot-password",
    "/reset-password",
    "/verify-reset",
    "/api/auth",
    "/api/contact",
    "/api/account/email/verify",
]);

const TEMPORARY_PUBLIC_PATH_PREFIXES = new Set<string>();

if (isNurseBootstrapEnabled()) {
    TEMPORARY_PUBLIC_PATH_PREFIXES.add("/bootstrap/nurse");
    TEMPORARY_PUBLIC_PATH_PREFIXES.add("/api/bootstrap/nurse");
}

const ROLE_GUARDS = [
    { prefix: "/nurse", role: "NURSE" },
    { prefix: "/doctor", role: "DOCTOR" },
    { prefix: "/scholar", role: "SCHOLAR" },
    { prefix: "/patient", role: "PATIENT" },
] as const;

type GuardRole = (typeof ROLE_GUARDS)[number]["role"];

function isPublicPath(pathname: string) {
    for (const prefix of PUBLIC_PATH_PREFIXES) {
        if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
            return true;
        }
    }

    for (const prefix of TEMPORARY_PUBLIC_PATH_PREFIXES) {
        if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
            return true;
        }
    }

    return false;
}

function createRedirect(req: NextRequest, path: string) {
    return NextResponse.redirect(new URL(path, req.url));
}

function clearAuthCookies(response: NextResponse) {
    const baseOptions = { maxAge: 0, path: "/", sameSite: "lax" as const };

    response.cookies.set("next-auth.session-token", "", { ...baseOptions, httpOnly: true });
    response.cookies.set("__Secure-next-auth.session-token", "", {
        ...baseOptions,
        httpOnly: true,
        secure: true,
    });
    response.cookies.set("next-auth.csrf-token", "", baseOptions);

    return response;
}

function guardResponse(
    req: NextRequest,
    status: number,
    message: string,
    redirectPath: string
) {
    const response = req.nextUrl.pathname.startsWith("/api")
        ? NextResponse.json({ error: message }, { status })
        : createRedirect(req, redirectPath);

    clearAuthCookies(response);
    return response;
}

function allowRequest() {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
}

/**
 * Guards protected routes by validating the session token and role access.
 */
export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (req.method === "OPTIONS") {
        return allowRequest();
    }

    if (isPublicPath(pathname)) {
        return allowRequest();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
        return guardResponse(req, 401, "Unauthorized: no session token", "/login");
    }

    const sessionUserId = typeof token.sub === "string" ? token.sub : token.id;
    const role = typeof token.role === "string" ? (token.role.toUpperCase() as GuardRole) : undefined;
    const status = typeof token.status === "string" ? token.status : undefined;

    if (!sessionUserId || !role) {
        return guardResponse(req, 401, "Unauthorized: incomplete session", "/login");
    }

    if (status === "Inactive") {
        return guardResponse(req, 403, "Account inactive. Contact admin.", "/login?error=inactive");
    }

    for (const { prefix, role: requiredRole } of ROLE_GUARDS) {
        if (pathname.startsWith(prefix) && role !== requiredRole) {
            return guardResponse(req, 403, "Unauthorized: insufficient role", "/login?error=unauthorized");
        }
    }

    return allowRequest();
}

// Apply only to protected routes
export const config = {
    matcher: [
        "/nurse/:path*",
        "/doctor/:path*",
        "/scholar/:path*",
        "/patient/:path*",
        "/api/:path*", // secure API routes too
    ],
};
