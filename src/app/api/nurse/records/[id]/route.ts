import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { id?: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: "Missing patient ID in request params" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { type, ...healthData } = body;

        if (!type || !["Student", "Employee"].includes(type)) {
            return NextResponse.json(
                { error: "Invalid or missing patient type" },
                { status: 400 }
            );
        }

        if (type === "Student") {
            const student = await prisma.student.update({
                where: { user_id: id },
                data: {
                    contactno: healthData.contactno ?? undefined,
                    address: healthData.address ?? undefined,
                    bloodtype: healthData.bloodtype ?? undefined,
                    allergies: healthData.allergies ?? undefined,
                    medical_cond: healthData.medical_cond ?? undefined,
                    emergencyco_name: healthData.emergency?.name ?? undefined,
                    emergencyco_num: healthData.emergency?.num ?? undefined,
                    emergencyco_relation: healthData.emergency?.relation ?? undefined,
                },
            });
            return NextResponse.json(student);
        }

        if (type === "Employee") {
            const employee = await prisma.employee.update({
                where: { user_id: id },
                data: {
                    contactno: healthData.contactno ?? undefined,
                    address: healthData.address ?? undefined,
                    bloodtype: healthData.bloodtype ?? undefined,
                    allergies: healthData.allergies ?? undefined,
                    medical_cond: healthData.medical_cond ?? undefined,
                    emergencyco_name: healthData.emergency?.name ?? undefined,
                    emergencyco_num: healthData.emergency?.num ?? undefined,
                    emergencyco_relation: healthData.emergency?.relation ?? undefined,
                },
            });
            return NextResponse.json(employee);
        }

        return NextResponse.json(
            { error: "Unhandled patient type" },
            { status: 400 }
        );
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error("PATCH /api/nurse/records/[id] error:", err.message);
        } else {
            console.error("PATCH /api/nurse/records/[id] error: Unknown error", err);
        }

        return NextResponse.json(
            { error: "Failed to update health data" },
            { status: 500 }
        );
    }
}
