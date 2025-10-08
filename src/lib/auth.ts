// src/lib/auth.ts
import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role, AccountStatus } from "@prisma/client";

// --- Extend next-auth types ---
declare module "next-auth" {
    interface User {
        status?: AccountStatus;
    }
    interface Session {
        user: {
            id: string;
            role: Role;
            name?: string | null;
            status?: AccountStatus;
            email?: string | null;
            image?: string | null;
        };
    }
}

// --- Custom app types ---
interface AppUser {
    id: string;
    name?: string | null;
    role: Role;
    status: AccountStatus;
}

interface AppJWT extends JWT {
    id?: string;
    role?: Role;
    status?: AccountStatus;
    lastChecked?: number;
}

interface AppSession extends Session {
    user: {
        id: string;
        role: Role;
        name?: string | null;
        status?: AccountStatus;
    };
}

// --- Auth configuration ---
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials", // ✅ Explicitly set ID (important for /callback/credentials)
            name: "Credentials",
            credentials: {
                id: { label: "ID", type: "text" },
                password: { label: "Password", type: "password" },
                role: { label: "Role", type: "text" },
            },
            async authorize(credentials): Promise<AppUser | null> {
                if (!credentials) throw new Error("Missing credentials.");

                const id = String(credentials.id || "").trim();
                const password = String(credentials.password || "");
                const roleStr = String(credentials.role || "").toUpperCase();

                if (!Object.values(Role).includes(roleStr as Role)) {
                    throw new Error("Invalid role provided.");
                }

                const role = roleStr as Role;

                // 🔍 Find the user in the DB
                const user = await prisma.users.findFirst({
                    where: {
                        role,
                        OR: [
                            { username: id },
                            { student: { is: { student_id: id } } },
                            { employee: { is: { employee_id: id } } },
                        ],
                    },
                    select: {
                        user_id: true,
                        password: true,
                        role: true,
                        status: true,
                        student: { select: { fname: true, lname: true } },
                        employee: { select: { fname: true, lname: true } },
                    },
                });

                if (!user) throw new Error("No account found with these credentials.");
                if (user.status === AccountStatus.Inactive) {
                    throw new Error("This account is inactive. Please contact the administrator.");
                }

                const ok = await bcrypt.compare(password, user.password);
                if (!ok) throw new Error("Invalid password.");

                return {
                    id: user.user_id,
                    name: user.student
                        ? `${user.student.fname} ${user.student.lname}`
                        : user.employee
                            ? `${user.employee.fname} ${user.employee.lname}`
                            : "User",
                    role: user.role,
                    status: user.status,
                };
            },
        }),
    ],

    // --- Sessions ---
    session: { strategy: "jwt" },

    // --- JWT + Session callbacks ---
    callbacks: {
        async jwt({ token, user }): Promise<AppJWT> {
            if (user) {
                const u = user as AppUser;
                token.id = u.id;
                token.role = u.role;
                token.name = u.name ?? token.name;
                token.status = u.status;
                token.lastChecked = Date.now();
            } else if (token.id) {
                const now = Date.now();
                const lastChecked = (token as AppJWT).lastChecked ?? 0;

                // Refresh every 5 minutes
                if (now - lastChecked > 5 * 60 * 1000) {
                    const dbUser = await prisma.users.findUnique({
                        where: { user_id: token.id },
                        select: { status: true },
                    });
                    token.status = dbUser?.status ?? AccountStatus.Inactive;
                    (token as AppJWT).lastChecked = now;
                }
            }
            return token as AppJWT;
        },

        async session({ session, token }): Promise<AppSession> {
            const t = token as AppJWT;
            if (session.user) {
                session.user.id = t.id ?? "";
                session.user.role = t.role ?? Role.PATIENT;
                session.user.name = t.name ?? session.user.name;
                session.user.status = t.status ?? AccountStatus.Inactive;
            }
            return session as AppSession;
        },
    },

    // --- Pages ---
    pages: {
        signIn: "/login",
        error: "/login",
    },

    // --- Secret (required in production) ---
    secret: process.env.NEXTAUTH_SECRET,
};
