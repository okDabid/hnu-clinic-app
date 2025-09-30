// src/lib/auth.ts
import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
                const role = String(credentials.role || "").toUpperCase();

                // Find user in database
                const user = await prisma.users.findFirst({
                    where: { username: id, role: role as any },
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
        async jwt({
            token,
            user,
        }: {
            token: JWT;
            user?: { id: string; name?: string | null; role?: string } | null;
        }): Promise<JWT> {
            if (user) {
                token.id = user.id;
                token.name = user.name ?? token.name;
                (token as any).role = user.role ?? (token as any).role;
            }
            return token;
        },

        async session({
            session,
            token,
        }: {
            session: Session;
            token: JWT;
        }): Promise<Session> {
            if (session.user) {
                (session.user as any).id =
                    (token as any).id ?? (token.sub as string | undefined);
                (session.user as any).role = (token as any).role ?? "";
                session.user.name = (token.name as string) ?? session.user.name;
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
        error: "/login", // redirect errors to your login page
    },
};
