import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { manilaNow } from "@/lib/time";

const ConsultationSchema = z.object({
    appointment_id: z.string(),
    reason_of_visit: z.string().optional(),
    findings: z.string().optional(),
    diagnosis: z.string().optional(),
    nurse_user_id: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctor = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { role: true },
        });

        if (!doctor || doctor.role !== Role.DOCTOR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const json = await req.json();
        const parsed = ConsultationSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { appointment_id, nurse_user_id, ...payload } = parsed.data;

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id },
            include: { consultation: true },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        if (appointment.consultation) {
            const updated = await prisma.consultation.update({
                where: { consultation_id: appointment.consultation.consultation_id },
                data: {
                    ...payload,
                    nurse_user_id: nurse_user_id ?? appointment.consultation.nurse_user_id ?? null,
                    doctor_user_id: appointment.consultation.doctor_user_id ?? session.user.id,
                },
            });

            return NextResponse.json(updated);
        }

        const created = await prisma.consultation.create({
            data: {
                appointment_id,
                doctor_user_id: session.user.id,
                nurse_user_id: nurse_user_id ?? null,
                reason_of_visit: payload.reason_of_visit ?? null,
                findings: payload.findings ?? null,
                diagnosis: payload.diagnosis ?? null,
                createdAt: manilaNow(),
            },
        });

        return NextResponse.json(created);
    } catch (err) {
        console.error("[POST /api/doctor/patient-consultations]", err);
        return NextResponse.json(
            { error: "Failed to save consultation notes" },
            { status: 500 }
        );
    }
}