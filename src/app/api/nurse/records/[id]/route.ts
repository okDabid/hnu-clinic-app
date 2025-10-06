import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BloodTypes = [
    "A_POS",
    "A_NEG",
    "B_POS",
    "B_NEG",
    "AB_POS",
    "AB_NEG",
    "O_POS",
    "O_NEG",
] as const;

const PatchSchema = z.object({
    type: z.enum(["Student", "Employee"]),
    contactno: z.string().optional(),
    address: z.string().optional(),
    bloodtype: z.enum(BloodTypes).nullable().optional(),
    allergies: z.string().optional(),
    medical_cond: z.string().optional(),
    emergency: z
        .object({
            name: z.string().optional(),
            num: z.string().optional(),
            relation: z.string().optional(),
        })
        .optional(),
});

export async function PATCH(
    req: Request,
    context: { params: { id: string } } // ✅ FIXED typing
) {
    try {
        const { id } = context.params;

        if (!id) {
            return NextResponse.json(
                { error: "Missing patient ID in request params" },
                { status: 400 }
            );
        }

        const json = await req.json();
        const parsed = PatchSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { type, ...healthData } = parsed.data;

        const commonData = {
            contactno: healthData.contactno ?? undefined,
            address: healthData.address ?? undefined,
            bloodtype:
                healthData.bloodtype !== undefined
                    ? { set: healthData.bloodtype }
                    : undefined,
            allergies: healthData.allergies ?? undefined,
            medical_cond: healthData.medical_cond ?? undefined,
            emergencyco_name: healthData.emergency?.name ?? undefined,
            emergencyco_num: healthData.emergency?.num ?? undefined,
            emergencyco_relation: healthData.emergency?.relation ?? undefined,
        };

        // 🧑‍🎓 Student update
        if (type === "Student") {
            const student = await prisma.student.update({
                where: { stud_user_id: id },
                data: commonData,
            });
            return NextResponse.json(student);
        }

        // 👩‍💼 Employee update
        if (type === "Employee") {
            const employee = await prisma.employee.update({
                where: { emp_id: id },
                data: commonData,
            });
            return NextResponse.json(employee);
        }

        return NextResponse.json(
            { error: "Unhandled patient type" },
            { status: 400 }
        );
    } catch (err) {
        console.error("PATCH /api/nurse/records/[id] error:", err);
        return NextResponse.json(
            { error: "Failed to update health data" },
            { status: 500 }
        );
    }
}
