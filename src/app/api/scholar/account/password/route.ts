import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function PUT(req: Request) {
    try {
        // 1. Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse incoming data
        const { oldPassword, newPassword } = await req.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json(
                { error: "Old and new password are required" },
                { status: 400 }
            );
        }

        // 3. Find user
        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 4. Role guard – only SCHOLAR
        if (user.role !== Role.SCHOLAR) {
            return NextResponse.json(
                { error: "Forbidden: Not a scholar" },
                { status: 403 }
            );
        }

        // 5. Verify old password
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 400 }
            );
        }

        // 6. Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.users.update({
            where: { user_id: user.user_id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        console.error("[PUT /api/scholar/account/password]", err);
        return NextResponse.json(
            { error: "Failed to update password" },
            { status: 500 }
        );
    }
}
