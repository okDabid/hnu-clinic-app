import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { AppointmentStatus } from "@prisma/client";

// ✅ Use Promise in context parameter (Next.js 14+ correct typing)
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // ✅ Await the promise for params
        const { id } = await context.params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action } = await request.json();

        // ✅ Map frontend actions to Prisma enum
        let newStatus: AppointmentStatus;
        switch (action) {
            case "approve":
                newStatus = "Approved";
                break;
            case "cancel":
                newStatus = "Cancelled";
                break;
            case "complete":
                newStatus = "Completed";
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        // ✅ Update appointment and include relations
        const updated = await prisma.appointment.update({
            where: { appointment_id: id },
            data: { status: newStatus },
            include: {
                patient: {
                    select: {
                        username: true,
                        student: { select: { fname: true, lname: true } },
                        employee: { select: { fname: true, lname: true } },
                    },
                },
                clinic: { select: { clinic_name: true } },
            },
        });

        // ✅ Format for frontend
        const patientName =
            updated.patient.student?.fname && updated.patient.student?.lname
                ? `${updated.patient.student.fname} ${updated.patient.student.lname}`
                : updated.patient.employee?.fname && updated.patient.employee?.lname
                    ? `${updated.patient.employee.fname} ${updated.patient.employee.lname}`
                    : updated.patient.username;

        return NextResponse.json({
            id: updated.appointment_id,
            patientName,
            clinic: updated.clinic.clinic_name,
            date: updated.appointment_date.toISOString().split("T")[0],
            time: new Date(updated.appointment_timestart).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            status: updated.status,
        });
    } catch (error) {
        console.error("[PATCH /api/doctor/appointments/:id]", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
