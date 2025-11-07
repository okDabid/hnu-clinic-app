// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import type { AccountStatus, Role } from "@prisma/client";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: Role;
            status?: AccountStatus;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        id: string;       // add id
        role: Role;       // make required
        status?: AccountStatus;
        name?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id?: string;
        role?: Role;
        status?: AccountStatus;
    }
}
