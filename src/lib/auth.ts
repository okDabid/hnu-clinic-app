// src/lib/auth.ts
import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Extend NextAuth's types
interface AppUser {
    id: string;
    name?: string | null;
    role: Role;
}

// Extend JWT type
interface AppJWT extends JWT {
    id?: string;
    role?: Role;
}

// Extend Session type
interface AppSession extends Session {
    user: {
        id: string;
        role: Role;
        name?: string | null;
    };
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                id: { label: "ID", type: "text" },
                password: { label: "Password", type: "password" },
                role: { label: "Role", type: "text" },
            },
            async authorize(credentials): Promise<AppUser | null> {
                if (!credentials) {
                    throw new Error("Missing credentials.");
                }

                const id = String(credentials.id || "").trim();
                const password = String(credentials.password || "");
                const roleStr = String(credentials.role || "").toUpperCase();

                if (!Object.values(Role).includes(roleStr as Role)) {
                    throw new Error("Invalid role provided.");
                }
                const role = roleStr as Role;

                const user = await prisma.users.findFirst({
                    where: { username: id, role },
                    include: { student: true, employee: true },
                });

                if (!user) {
                    throw new Error("No account found with these credentials.");
                }

                const ok = await bcrypt.compare(password, user.password);
                if (!ok) {
                    throw new Error("Invalid password.");
                }

                return {
                    id: user.user_id,
                    name: user.student
                        ? `${user.student.fname} ${user.student.lname}`
                        : user.employee
                            ? `${user.employee.fname} ${user.employee.lname}`
                            : "User",
                    role: user.role,
                };
            },
        }),
    ],

    session: { strategy: "jwt" },

    callbacks: {
        async jwt({ token, user }): Promise<AppJWT> {
            if (user) {
                const u = user as AppUser;
                token.id = u.id;
                token.role = u.role;
                token.name = u.name ?? token.name;
            }
            return token as AppJWT;
        },

        async session({ session, token }): Promise<AppSession> {
            const t = token as AppJWT;
            if (session.user) {
                session.user.id = t.id ?? token.sub ?? "";
                session.user.role = t.role ?? Role.PATIENT; // fallback role
                session.user.name = t.name ?? session.user.name;
            }
            return session as AppSession;
        },
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },
};
