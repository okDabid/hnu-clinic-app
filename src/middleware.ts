import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

        // Guard nurse pages
        if (pathname.startsWith("/nurse") && role !== "NURSE") {
            return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
        }

        // Guard doctor pages
        if (pathname.startsWith("/doctor") && role !== "DOCTOR") {
            return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
        }

        // Guard scholar pages
        if (pathname.startsWith("/scholar") && role !== "SCHOLAR") {
            return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
        }

        // Guard patient pages
        if (pathname.startsWith("/patient") && role !== "PATIENT") {
            return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
        }

        // Guard admin pages
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
