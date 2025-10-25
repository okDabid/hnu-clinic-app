import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { manilaNow } from "@/lib/time";
import { handleAuthError, requireRole } from "@/lib/authorization";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const session = await requireRole([Role.NURSE, Role.ADMIN]);

        const body = await req.json();
        const { appointment_id, reason_of_visit, findings, diagnosis } = body;

        if (!appointment_id || typeof appointment_id !== "string") {
            return NextResponse.json(
                { error: "Valid appointment_id is required" },
                { status: 400 }
            );
        }

        const nurse_user_id = session.user.id;

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
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
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
