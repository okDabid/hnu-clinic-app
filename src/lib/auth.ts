// src/lib/auth.ts
import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client"; // ✅ use generated enum

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                id: { label: "ID", type: "text" },
                password: { label: "Password", type: "password" },
                role: { label: "Role", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials) {
                    throw new Error("Missing credentials.");
                }

                const id = String(credentials.id || "").trim();
                const password = String(credentials.password || "");
                const roleStr = String(credentials.role || "").toUpperCase();

                // ✅ Validate against Prisma enum
                if (!Object.values(Role).includes(roleStr as Role)) {
                    throw new Error("Invalid role provided.");
                }
                const role = roleStr as Role;

                // Find user in DB
                const user = await prisma.users.findFirst({
                    where: { username: id, role },
                    include: { student: true, employee: true },
                });

                if (!user) {
                    throw new Error("No account found with these credentials.");
                }

                // Verify password
                const ok = await bcrypt.compare(password, user.password);
                if (!ok) {
                    throw new Error("Invalid password.");
                }

                // Return safe user object
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
        async jwt({ token, user }): Promise<JWT> {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role; // token.role is typed as string | undefined
                token.name = user.name ?? token.name;
            }
            return token;
        },

        async session({ session, token }): Promise<Session> {
            if (session.user) {
                session.user.id = token.id ?? token.sub ?? "";
                session.user.role = (token as any).role ?? "";
                session.user.name = token.name ?? session.user.name;
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },
};
