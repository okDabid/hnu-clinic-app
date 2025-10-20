import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Request validation schema
const BodySchema = z.object({
    oldPassword: z.string().min(1, "Current password is required."),
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters.")
        .max(128, "Password must be at most 128 characters.")
        .refine((s) => /[a-z]/.test(s), "Must contain a lowercase letter.")
        .refine((s) => /[A-Z]/.test(s), "Must contain an uppercase letter.")
        .refine((s) => /\d/.test(s), "Must contain a number.")
        .refine((s) => /[^\w\s]/.test(s), "Must contain a symbol."),
});

// PUT handler
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const body = await req.json().catch(() => null);
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
                { status: 400 }
            );
        }

        const { oldPassword, newPassword } = parsed.data;

        // Fetch user
        const user = await prisma.users.findUnique({ where: { user_id: userId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify old password
        const oldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!oldPasswordValid) {
            return NextResponse.json(
                { error: "Incorrect current password" },
                { status: 400 }
            );
        }

        // Prevent reusing the same password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return NextResponse.json(
                { error: "New password must be different from the old one" },
                { status: 400 }
            );
        }

        // Hash and update password
        const newHash = await bcrypt.hash(newPassword, 12);
        await prisma.users.update({
            where: { user_id: userId },
            data: { password: newHash },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("PUT /api/nurse/accounts/password error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Add GET handler for debugging
export async function GET() {
    return NextResponse.json({ message: "Password route is live" });
}

// Ensure bcrypt runs on Node runtime (not edge)
export const runtime = "nodejs";
