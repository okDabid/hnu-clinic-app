import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { listDispenses, recordDispense, DispenseError } from "@/lib/dispense";
import { handleAuthError, requireRole } from "@/lib/authorization";
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
        const session = await requireRole([Role.NURSE]);

        const now = new Date();

        const physicians = await prisma.users.findMany({
            where: {
                role: Role.DOCTOR,
                employee: { specialization: "Physician" },
            },
            select: { user_id: true },
        });

        const physicianIds = physicians.map((p) => p.user_id);

        const [dispenses, consultations, medicines] = await Promise.all([
            listDispenses(),
            prisma.consultation.findMany({
                where: {
                    doctor_user_id: { in: physicianIds },
                },
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
                include: {
                    clinic: { select: { clinic_name: true } },
                    replenishments: {
                        where: {
                            remaining_qty: { gt: 0 },
                            expiry_date: { gte: now },
                        },
                    },
                },
                orderBy: { item_name: "asc" },
            }),
        ]);

        const consultationOptions = consultations
            .filter((c) => c.appointment?.patient && c.appointment?.clinic)
            .map((c) => ({
                consultation_id: c.consultation_id,
                patientName: formatPatientName(c.appointment!.patient),
                clinicName: c.appointment!.clinic.clinic_name,
                appointmentDate: c.appointment?.appointment_timestart
                    ? c.appointment.appointment_timestart.toISOString()
                    : null,
                consultedAt: c.createdAt?.toISOString() ?? null,
            }));

        const medicineOptions = medicines
            .map((m) => {
                const availableQty = m.replenishments.reduce(
                    (total, batch) => total + batch.remaining_qty,
                    0
                );

                return {
                    med_id: m.med_id,
                    item_name: m.item_name,
                    clinicName: m.clinic.clinic_name,
                    quantity: availableQty,
                };
            })
            .filter((m) => m.quantity > 0);

        return NextResponse.json({
            dispenses,
            consultations: consultationOptions,
            medicines: medicineOptions,
        });
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("GET /api/nurse/dispense error:", err);
        return NextResponse.json(
            { error: "Failed to load dispenses" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await requireRole([Role.NURSE]);

        const {
            med_id,
            consultation_id,
            quantity,
            walkInIdNumber,
            walkInContact,
            walkInNotes,
            scholarUserId,
        } = await req.json();

        if (!med_id || quantity === undefined) {
            return NextResponse.json(
                { error: "med_id and quantity are required" },
                { status: 400 }
            );
        }

        if (!consultation_id && !walkInIdNumber) {
            return NextResponse.json(
                { error: "Provide a consultation_id or walk-in ID number" },
                { status: 400 }
            );
        }

        if (!consultation_id && walkInIdNumber && !scholarUserId) {
            return NextResponse.json(
                { error: "Walk-in dispenses must include the assisting scholar" },
                { status: 400 }
            );
        }

        const newDispense = await recordDispense({
            med_id,
            consultation_id: consultation_id ?? null,
            quantity: Number(quantity),
            walkIn: walkInIdNumber
                ? {
                    idNumber: walkInIdNumber,
                    contact: walkInContact ?? null,
                    notes: walkInNotes ?? null,
                }
                : undefined,
            scholar_user_id: walkInIdNumber ? scholarUserId ?? null : null,
        });
        return NextResponse.json(newDispense);
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        if (err instanceof DispenseError) {
            return NextResponse.json({ error: "Unable to dispense medicine" }, { status: err.status });
        }

        console.error("POST /api/nurse/dispense error:", err);
        return NextResponse.json(
            { error: "Failed to record dispense" },
            { status: 500 }
        );
    }
}