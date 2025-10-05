import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { oldPassword, newPassword } = await req.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json(
                { error: "Old and new password are required" },
                { status: 400 }
            );
        }

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role !== Role.PATIENT) {
            return NextResponse.json(
                { error: "Forbidden: Not a patient" },
                { status: 403 }
            );
        }

        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/patient/account/password]", err);
        return NextResponse.json(
            { error: "Failed to update password" },
            { status: 500 }
        );
    }
}
