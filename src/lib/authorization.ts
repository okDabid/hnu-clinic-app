import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";

export class AuthorizationError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = "AuthorizationError";
    }
}

export async function requireRole(allowedRoles: Role[]) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        throw new AuthorizationError("Unauthorized", 401);
    }

    if (!allowedRoles.includes(session.user.role)) {
        throw new AuthorizationError("Forbidden", 403);
    }

    return session;
}

export function handleAuthError(error: unknown) {
    if (error instanceof AuthorizationError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return null;
}
