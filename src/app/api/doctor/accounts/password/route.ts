import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { oldPassword, newPassword } = await req.json();

        const user = await prisma.users.findUnique({ where: { user_id: session.user.id } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid) return NextResponse.json({ error: "Invalid current password" }, { status: 400 });

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.users.update({
            where: { user_id: session.user.id },
            data: { password: hashed },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/doctor/accounts/password]", err);
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }
}
