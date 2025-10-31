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

                const baseUserSelect = {
                    user_id: true,
                    password: true,
                    role: true,
                    status: true,
                } as const;

                const baseUserWithRelationsSelect = {
                    ...baseUserSelect,
                    student: { select: { fname: true, lname: true } },
                    employee: { select: { fname: true, lname: true } },
                } as const;

                type SelectedUser = {
                    user_id: string;
                    password: string;
                    role: Role;
                    status: AccountStatus;
                    student?: { fname: string; lname: string } | null;
                    employee?: { fname: string; lname: string } | null;
                };

                type UserQueryResult = {
                    user: SelectedUser;
                    profileName?: string | null;
                } | null;

                const byUsername: UserQueryResult = await withDb(() =>
                    prisma.users.findFirst({
                        where: {
                            role,
                            OR: [
                                { username: id },
                                { username: { startsWith: `${id}-` } },
                            ],
                        },
                        select: baseUserWithRelationsSelect,
                    }).then((user) => (user ? { user } : null))
                );

                let user: UserQueryResult = byUsername;

                if (!user && (role === Role.DOCTOR || role === Role.NURSE)) {
                    user = await withDb(() =>
                        prisma.employee.findUnique({
                            where: { employee_id: id },
                            select: {
                                fname: true,
                                lname: true,
                                user: { select: baseUserSelect },
                            },
                        }).then((record) =>
                            record && record.user
                                ? {
                                      user: record.user,
                                      profileName: `${record.fname} ${record.lname}`,
                                  }
                                : null
                        )
                    );
                }

                if (!user && role === Role.SCHOLAR) {
                    user = await withDb(() =>
                        prisma.student.findUnique({
                            where: { student_id: id },
                            select: {
                                fname: true,
                                lname: true,
                                user: { select: baseUserSelect },
                            },
                        }).then((record) =>
                            record && record.user
                                ? {
                                      user: record.user,
                                      profileName: `${record.fname} ${record.lname}`,
                                  }
                                : null
                        )
                    );
                }

                if (!user && role === Role.PATIENT) {
                    user = await withDb(() =>
                        prisma.student.findUnique({
                            where: { student_id: id },
                            select: {
                                fname: true,
                                lname: true,
                                user: { select: baseUserSelect },
                            },
                        }).then((record) =>
                            record && record.user
                                ? {
                                      user: record.user,
                                      profileName: `${record.fname} ${record.lname}`,
                                  }
                                : null
                        )
                    );

                    if (!user) {
                        user = await withDb(() =>
                            prisma.employee.findUnique({
                                where: { employee_id: id },
                                select: {
                                    fname: true,
                                    lname: true,
                                    user: { select: baseUserSelect },
                                },
                            }).then((record) =>
                                record && record.user
                                    ? {
                                          user: record.user,
                                          profileName: `${record.fname} ${record.lname}`,
                                      }
                                    : null
                            )
                        );
                    }
                }

                if (!user) throw new Error("No account found with these credentials.");

                if (user.user.role !== role)
                    throw new Error("Role mismatch for provided credentials.");

                if (user.user.status === AccountStatus.Inactive)
                    throw new Error("This account is inactive. Please contact the administrator.");

                const ok = await bcrypt.compare(password, user.user.password);
                if (!ok) throw new Error("Invalid password.");

                const derivedName =
                    user.profileName?.trim() ||
                    (user.user.student
                        ? `${user.user.student.fname} ${user.user.student.lname}`
                        : user.user.employee
                            ? `${user.user.employee.fname} ${user.user.employee.lname}`
                            : "User");

                return {
                    id: user.user.user_id,
                    name: derivedName,
                    role: user.user.role,
                    status: user.user.status,
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
