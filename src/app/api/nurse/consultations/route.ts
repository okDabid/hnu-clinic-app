import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { manilaNow } from "@/lib/time";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { appointment_id, nurse_user_id, reason_of_visit, findings, diagnosis } = body;

        if (!appointment_id || typeof appointment_id !== "string") {
            return NextResponse.json(
                { error: "Valid appointment_id is required" },
                { status: 400 }
            );
        }

        if (!nurse_user_id || typeof nurse_user_id !== "string") {
            return NextResponse.json(
                { error: "Valid nurse_user_id is required" },
                { status: 400 }
            );
        }

        const appointment = await prisma.appointment.findUnique({
            where: { appointment_id },
            include: { consultation: { select: { consultation_id: true } } },
        });

        if (!appointment) {
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        if (appointment.consultation) {
            return NextResponse.json(
                { error: "Consultation already exists for this appointment" },
                { status: 409 }
            );
        }

        const consultation = await prisma.consultation.create({
            data: {
                appointment_id,
                doctor_user_id: appointment.doctor_user_id,
                nurse_user_id,
                reason_of_visit: reason_of_visit ?? null,
                findings: findings ?? null,
                diagnosis: diagnosis ?? null,
                createdAt: manilaNow(),
            },
        });

        return NextResponse.json(consultation);
    } catch (err: unknown) {
        // Narrow the type safely
        if (err instanceof Error) {
            console.error("POST /api/nurse/consultations error:", err.message);
        } else {
            console.error("POST /api/nurse/consultations error: Unknown error", err);
        }

        return NextResponse.json(
            { error: "Failed to save consultation notes" },
            { status: 500 }
        );
    }
}
