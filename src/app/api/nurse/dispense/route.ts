import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ GET: Fetch all dispenses with consultation + patient + clinic info
export async function GET() {
    try {
        const dispenses = await prisma.medDispense.findMany({
            include: {
                med: {
                    include: {
                        clinic: { select: { clinic_name: true } }, // ✅ show clinic name
                    },
                },
                consultation: {
                    include: {
                        appointment: {
                            include: {
                                patient: { select: { username: true } }, // ✅ patient username
                                clinic: { select: { clinic_name: true } }, // ✅ clinic name (from appointment)
                            },
                        },
                        doctor: { select: { username: true } },
                        nurse: { select: { username: true } },
                    },
                },
            },
            orderBy: { dispense_id: "desc" },
        });

        return NextResponse.json(dispenses);
    } catch (err) {
        console.error("GET /api/nurse/dispense error:", err);
        return NextResponse.json(
            { error: "Failed to load dispenses" },
            { status: 500 }
        );
    }
}

// ✅ POST: Record a new dispense with patient + clinic info
export async function POST(req: Request) {
    try {
        const { med_id, consultation_id, quantity } = await req.json();

        if (!med_id || !consultation_id || !quantity) {
            return NextResponse.json(
                { error: "med_id, consultation_id, and quantity are required" },
                { status: 400 }
            );
        }

        // Check medicine exists and has enough stock
        const med = await prisma.medInventory.findUnique({
            where: { med_id },
        });

        if (!med || med.quantity < Number(quantity)) {
            return NextResponse.json(
                { error: "Not enough stock available" },

                { status: 400 }
            );
        }

        // ✅ Transaction: deduct stock + create dispense record
        const [newDispense] = await prisma.$transaction([
            prisma.medInventory.update({
                where: { med_id },
                data: { quantity: { decrement: Number(quantity) } },
            }),
            prisma.medDispense.create({
                data: {
                    med_id,
                    consultation_id,
                    quantity: Number(quantity),
                },
                include: {
                    med: {
                        include: { clinic: { select: { clinic_name: true } } },
                    },
                    consultation: {
                        include: {
                            appointment: {
                                include: {
                                    patient: { select: { username: true } },
                                    clinic: { select: { clinic_name: true } },
                                },
                            },
                            doctor: { select: { username: true } },
                            nurse: { select: { username: true } },
                        },
                    },
                },
            }),
        ]);

        return NextResponse.json(newDispense);
    } catch (err) {
        console.error("POST /api/nurse/dispense error:", err);
        return NextResponse.json(
            { error: "Failed to record dispense" },
            { status: 500 }
        );
    }
}
