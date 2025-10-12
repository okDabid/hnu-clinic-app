import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function phDate(d: Date | string) {
    return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }); // YYYY-MM-DD
}
function phTime(d: Date | string) {
    return new Date(d).toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctorId = session.user.id;

        const appointments = await prisma.appointment.findMany({
            where: { doctor_user_id: doctorId },
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
            orderBy: { appointment_date: "desc" },
        });

        const formatted = appointments.map((a) => ({
            id: a.appointment_id,
            patientName:
                a.patient.student?.fname && a.patient.student?.lname
                    ? `${a.patient.student.fname} ${a.patient.student.lname}`
                    : a.patient.employee?.fname && a.patient.employee?.lname
                        ? `${a.patient.employee.fname} ${a.patient.employee.lname}`
                        : a.patient.username,
            clinic: a.clinic.clinic_name,
            // ✅ FIXED: Convert UTC → PH properly
            date: phDate(a.appointment_timestart),
            time: phTime(a.appointment_timestart),
            status: a.status,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("[GET /api/doctor/appointments]", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
