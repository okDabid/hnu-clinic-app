import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { AccountStatus } from "@prisma/client";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    // ✅ If no token and trying to access protected route → redirect to login
    if (!token && !pathname.startsWith("/login") && !pathname.startsWith("/api")) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // ✅ If user IS logged in
    if (token) {
        const role = token.role as string;
        const status = token.status as AccountStatus | undefined;

        // Block inactive accounts
        if (status === "Inactive") {
            return NextResponse.redirect(new URL("/login?error=inactive", req.url));
        }

        // Role-based guards
        if (pathname.startsWith("/nurse") && role !== "NURSE") {
            return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
        }

        if (pathname.startsWith("/doctor") && role !== "DOCTOR") {
            return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
        }

        if (pathname.startsWith("/scholar") && role !== "SCHOLAR") {
            return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
        }

        if (pathname.startsWith("/patient") && role !== "PATIENT") {
            return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
        }

        if (pathname.startsWith("/admin") && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
        }
    }

    // ✅ Allow request
    return NextResponse.next();
}

// ✅ Apply middleware only to protected routes
export const config = {
    matcher: [
        "/nurse/:path*",
        "/doctor/:path*",
        "/scholar/:path*",
        "/patient/:path*",
        "/admin/:path*",
    ],
};
