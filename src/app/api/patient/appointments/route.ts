import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rangesOverlap } from "@/lib/time";

// 🕒 Helpers
function buildManilaDate(date: string, time: string) {
    return new Date(`${date}T${time}:00+08:00`);
}
function startOfManilaDay(date: string) {
    return new Date(`${date}T00:00:00+08:00`);
}
function endOfManilaDay(date: string) {
    return new Date(`${date}T23:59:59+08:00`);
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const patientId = session.user.id;

        const appointments = await prisma.appointment.findMany({
            where: { patient_user_id: patientId },
            include: {
                doctor: {
                    select: {
                        username: true,
                        employee: { select: { fname: true, lname: true } },
                        student: { select: { fname: true, lname: true } },
                    },
                },
                clinic: { select: { clinic_name: true } },
            },
            orderBy: { appointment_timestart: "asc" },
        });

        const formatted = appointments.map((a) => {
            // 🧾 pick best available doctor name
            const doctorName =
                a.doctor?.employee?.fname && a.doctor?.employee?.lname
                    ? `${a.doctor.employee.fname} ${a.doctor.employee.lname}`
                    : a.doctor?.student?.fname && a.doctor?.student?.lname
                        ? `${a.doctor.student.fname} ${a.doctor.student.lname}`
                        : a.doctor?.username ?? "-";

            return {
                id: a.appointment_id,
                clinic: a.clinic?.clinic_name ?? "-",
                doctor: doctorName,
                date: new Date(a.appointment_timestart).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }),
                time: new Date(a.appointment_timestart).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Manila",
                }),
                status: a.status,
            };
        });

        return NextResponse.json(formatted);
    } catch (err) {
        console.error("[GET /api/patient/appointments]", err);
        return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
    }
}



export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const patient_user_id = session.user.id as string;
        const body = await req.json();
        const { clinic_id, doctor_user_id, service_type, date, time_start, time_end } = body || {};

        if (!clinic_id || !doctor_user_id || !service_type || !date || !time_start || !time_end)
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });

        const clinic = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinic) return NextResponse.json({ message: "Clinic not found" }, { status: 404 });

        const doctor = await prisma.users.findUnique({ where: { user_id: doctor_user_id } });
        if (!doctor || doctor.role !== "DOCTOR")
            return NextResponse.json({ message: "Doctor not found" }, { status: 404 });

        // ✅ Build PH-local timestamps
        const appointment_date = buildManilaDate(date, "00:00");
        const appointment_timestart = buildManilaDate(date, time_start);
        const appointment_timeend = buildManilaDate(date, time_end);
        const startOfDay = startOfManilaDay(date);
        const endOfDay = endOfManilaDay(date);

        if (!(appointment_timestart < appointment_timeend))
            return NextResponse.json({ message: "Invalid time range" }, { status: 400 });

        // ✅ Check if within availability
        const availabilities = await prisma.doctorAvailability.findMany({
            where: {
                doctor_user_id,
                clinic_id,
                available_date: { gte: startOfDay, lte: endOfDay },
            },
        });

        const withinAvailability = availabilities.some(
            (av) =>
                appointment_timestart >= av.available_timestart &&
                appointment_timeend <= av.available_timeend
        );

        if (!withinAvailability)
            return NextResponse.json(
                { message: "Selected time is outside doctor's availability" },
                { status: 400 }
            );

        // ✅ Check overlapping appointments
        const existing = await prisma.appointment.findMany({
            where: {
                doctor_user_id,
                appointment_timestart: { gte: startOfDay, lte: endOfDay },
                status: { in: ["Pending", "Approved"] },
            },
        });

        const conflict = existing.some((e) =>
            rangesOverlap(
                appointment_timestart,
                appointment_timeend,
                e.appointment_timestart,
                e.appointment_timeend
            )
        );

        if (conflict)
            return NextResponse.json({ message: "Time slot already booked" }, { status: 409 });

        // ✅ Create the appointment
        const created = await prisma.appointment.create({
            data: {
                patient_user_id,
                clinic_id,
                doctor_user_id,
                appointment_date,
                appointment_timestart,
                appointment_timeend,
                service_type,
                status: "Pending",
            },
        });

        return NextResponse.json({
            appointment_id: created.appointment_id,
            status: created.status,
        });
    } catch (error) {
        console.error("[POST /api/patient/appointments]", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
