import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, Prisma } from "@prisma/client";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
        where: { user_id: session.user.id },
        include: { employee: true }, // doctor is stored in Employee table
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
        accountId: user.user_id,
        username: user.username,
        role: user.role,
        status: user.status,
        profile: user.employee ?? null,
    });
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const profile = payload?.profile ?? {};

    const user = await prisma.users.findUnique({
        where: { user_id: session.user.id },
        include: { employee: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== Role.DOCTOR || !user.employee) {
        return NextResponse.json({ error: "Not a doctor" }, { status: 403 });
    }

    const allowedFields = [
        "fname", "mname", "lname", "contactno", "address",
        "bloodtype", "allergies", "medical_cond",
        "emergencyco_name", "emergencyco_num", "emergencyco_relation",
    ] as const;

    const updateData: Prisma.EmployeeUpdateInput = {};
    for (const field of allowedFields) {
        if (field in profile) {
            (updateData as any)[field] = profile[field];
        }
    }

    await prisma.employee.update({
        where: { user_id: session.user.id },
        data: updateData,
    });

    return NextResponse.json({ success: true });
}
