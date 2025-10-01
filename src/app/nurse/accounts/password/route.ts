import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authOptions } from "@/lib/auth"; // adjust path if needed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Strong password policy
const passwordPolicy = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters.")
    .refine((s) => /[a-z]/.test(s), "Must contain a lowercase letter.")
    .refine((s) => /[A-Z]/.test(s), "Must contain an uppercase letter.")
    .refine((s) => /\d/.test(s), "Must contain a number.")
    .refine((s) => /[^\w\s]/.test(s), "Must contain a symbol.");

const BodySchema = z.object({
    oldPassword: z.string().min(1, "Current password is required."),
    newPassword: passwordPolicy,
});

export async function PUT(req: Request) {
    try {
        // 1. Check session
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // In your session, you need either user_id or username exposed
        const userId = (session.user as any).id as string | undefined;
        const username = session.user.name as string | undefined;

        if (!userId && !username) {
            return NextResponse.json({ error: "Missing user identifier" }, { status: 400 });
        }

        // 2. Parse & validate body
        const body = await req.json().catch(() => null);
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
                { status: 400 }
            );
        }

        const { oldPassword, newPassword } = parsed.data;

        // 3. Find user
        const user = userId
            ? await prisma.users.findUnique({ where: { user_id: userId } })
            : await prisma.users.findUnique({ where: { username: username! } });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 4. Verify old password
        const ok = await bcrypt.compare(oldPassword, user.password);
        if (!ok) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
        }

        // Prevent reuse
        const sameAsOld = await bcrypt.compare(newPassword, user.password);
        if (sameAsOld) {
            return NextResponse.json(
                { error: "New password must be different from the old one." },
                { status: 400 }
            );
        }

        // 5. Hash & update
        const newHash = await bcrypt.hash(newPassword, 12);

        await prisma.users.update({
            where: userId ? { user_id: userId } : { username: username! },
            data: { password: newHash },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export const runtime = "nodejs"; // bcrypt needs Node runtime in Next.js
