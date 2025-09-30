import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client"; // ✅ import enum

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
                const role = String(credentials.role || "").toUpperCase() as Role; // ✅ cast to Role enum

                const user = await prisma.users.findFirst({
                    where: { username: id, role },
                    include: { student: true, employee: true }, // ✅ works only if schema has relations
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
        async jwt({ token, user }): Promise<JWT> {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.name = user.name ?? token.name;
            }
            return token;
        },

        async session({ session, token }): Promise<Session> {
            if (session.user) {
                session.user.id = token.id ?? token.sub ?? "";
                session.user.role = token.role ?? "";
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
