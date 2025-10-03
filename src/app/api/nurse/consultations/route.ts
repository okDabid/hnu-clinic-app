import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

        const consultation = await prisma.consultation.create({
            data: {
                appointment_id,
                nurse_user_id,
                reason_of_visit: reason_of_visit ?? null,
                findings: findings ?? null,
                diagnosis: diagnosis ?? null,
            },
        });

        return NextResponse.json(consultation);
    } catch (err: any) {
        console.error("POST /api/nurse/consultations error:", err);
        return NextResponse.json(
            { error: "Failed to save consultation notes" },
            { status: 500 }
        );
    }
}
