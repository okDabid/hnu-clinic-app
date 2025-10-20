// src/lib/auth.ts
import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs"; // non-blocking, faster in serverless
import { prisma } from "@/lib/prisma";
import { Role, AccountStatus } from "@prisma/client";
import { withDb } from "@/lib/withDb";

/** Extend next-auth types used by the application. */
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

/** Main NextAuth configuration. */
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                id: { label: "ID", type: "text" },
                password: { label: "Password", type: "password" },
                role: { label: "Role", type: "text" },
            },
            // Validate user-provided credentials against stored records.
            async authorize(credentials): Promise<AppUser | null> {
                if (!credentials) throw new Error("Missing credentials.");

                const id = String(credentials.id || "").trim();
                const password = String(credentials.password || "");
                const roleStr = String(credentials.role || "").toUpperCase();
                if (!Object.values(Role).includes(roleStr as Role)) {
                    throw new Error("Invalid role provided.");
                }
                const role = roleStr as Role;

                // Find user (indexed query)
                const user = await withDb(() =>
                    prisma.users.findFirst({
                        where: {
                            role,
                            OR: [
                                { username: id },
                                { username: { startsWith: `${id}-` } },
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
                    })
                );

                if (!user) throw new Error("No account found with these credentials.");
                if (user.status === AccountStatus.Inactive)
                    throw new Error("This account is inactive. Please contact the administrator.");

                // Password verification (non-blocking)
                const ok = await bcrypt.compare(password, user.password);
                if (!ok) throw new Error("Invalid password.");

                // Return user payload
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

    callbacks: {
        // Populate JWT tokens with the fields required by the client.
        async jwt({ token, user }): Promise<AppJWT> {
            if (user) {
                const u = user as AppUser;
                token.id = u.id;
                token.role = u.role;
                token.name = u.name ?? token.name;
                token.status = u.status;
                token.lastChecked = Date.now();
            } else if (token.id) {
                // Refresh account status every five minutes to keep status in sync
                const now = Date.now();
                const lastChecked = (token as AppJWT).lastChecked ?? 0;

                if (now - lastChecked > 5 * 60 * 1000) {
                    const dbUser = await withDb(() =>
                        prisma.users.findUnique({
                            where: { user_id: token.id as string },
                            select: { status: true },
                        })
                    );
                    token.status = dbUser?.status ?? AccountStatus.Inactive;
                    (token as AppJWT).lastChecked = now;
                }
            }
            return token as AppJWT;
        },

        // Shape the session response using the token values.
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

    pages: { signIn: "/login", error: "/login" },
    secret: process.env.NEXTAUTH_SECRET,
};
