import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listDispenses, recordDispense, DispenseError } from "@/lib/dispense";
import { Role } from "@prisma/client";

function formatPatientName(patient: {
    username: string;
    student?: { fname: string | null; lname: string | null } | null;
    employee?: { fname: string | null; lname: string | null } | null;
}) {
    const studentName = patient.student?.fname && patient.student?.lname
        ? `${patient.student.fname} ${patient.student.lname}`
        : null;
    const employeeName = patient.employee?.fname && patient.employee?.lname
        ? `${patient.employee.fname} ${patient.employee.lname}`
        : null;

    return studentName || employeeName || patient.username;
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctor = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { user_id: true, role: true },
        });

        if (!doctor || doctor.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const [dispenses, consultations, medicines] = await Promise.all([
            listDispenses(),
            prisma.consultation.findMany({
                where: { doctor_user_id: doctor.user_id },
                include: {
                    appointment: {
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
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.medInventory.findMany({
                include: { clinic: { select: { clinic_name: true } } },
                orderBy: { item_name: "asc" },
            }),
        ]);

        const consultationOptions = consultations
            .filter((c) => c.appointment?.patient && c.appointment?.clinic)
            .map((c) => ({
                consultation_id: c.consultation_id,
                patientName: formatPatientName(c.appointment!.patient),
                clinicName: c.appointment!.clinic.clinic_name,
                appointmentDate: c.appointment?.appointment_date ?? null,
            }));

        const medicineOptions = medicines.map((m) => ({
            med_id: m.med_id,
            item_name: m.item_name,
            clinicName: m.clinic.clinic_name,
            quantity: m.quantity,
        }));

        return NextResponse.json({
            dispenses,
            consultations: consultationOptions,
            medicines: medicineOptions,
        });
    } catch (err) {
        console.error("GET /api/doctor/dispense error:", err);
        return NextResponse.json({ error: "Failed to load dispense data" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctor = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { user_id: true, role: true },
        });

        if (!doctor || doctor.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { med_id, consultation_id, quantity } = await req.json();

        if (!med_id || !consultation_id || quantity === undefined) {
            return NextResponse.json(
                { error: "med_id, consultation_id, and quantity are required" },
                { status: 400 }
            );
        }

        const consultation = await prisma.consultation.findUnique({
            where: { consultation_id },
            select: { doctor_user_id: true },
        });

        if (!consultation) {
            return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
        }

        if (consultation.doctor_user_id && consultation.doctor_user_id !== doctor.user_id) {
            return NextResponse.json({ error: "Consultation does not belong to you" }, { status: 403 });
        }

        const newDispense = await recordDispense({
            med_id,
            consultation_id,
            quantity: Number(quantity),
        });

        return NextResponse.json(newDispense);
    } catch (err) {
        if (err instanceof DispenseError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }

        console.error("POST /api/doctor/dispense error:", err);
        return NextResponse.json({ error: "Failed to record dispense" }, { status: 500 });
    }
}