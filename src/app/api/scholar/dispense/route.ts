import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { listDispenses, recordDispense, DispenseError } from "@/lib/dispense";
import { prisma } from "@/lib/prisma";

function buildMedicineOptions(medicines: Array<{
    med_id: string;
    item_name: string;
    clinic: { clinic_name: string };
    replenishments: { remaining_qty: number }[];
}>) {
    return medicines
        .map((medicine) => {
            const remaining = medicine.replenishments.reduce(
                (total, batch) => total + batch.remaining_qty,
                0
            );

            return {
                med_id: medicine.med_id,
                item_name: medicine.item_name,
                clinicName: medicine.clinic.clinic_name,
                quantity: remaining,
            };
        })
        .filter((entry) => entry.quantity > 0)
        .sort((a, b) => a.item_name.localeCompare(b.item_name));
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const scholar = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { user_id: true, role: true },
        });

        if (!scholar || scholar.role !== Role.SCHOLAR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const now = new Date();

        const [dispenses, medicines] = await Promise.all([
            listDispenses(),
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
            }),
        ]);

        const walkInDispenses = dispenses.filter((d) => !d.consultation);

        return NextResponse.json({
            dispenses: walkInDispenses,
            medicines: buildMedicineOptions(medicines),
        });
    } catch (err) {
        console.error("GET /api/scholar/dispense error:", err);
        return NextResponse.json({ error: "Failed to load walk-in dispenses" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const scholar = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            select: { user_id: true, role: true },
        });

        if (!scholar || scholar.role !== Role.SCHOLAR) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { med_id, quantity, walkInName, walkInContact, walkInNotes } = await req.json();

        if (!med_id || quantity === undefined || !walkInName) {
            return NextResponse.json(
                { error: "med_id, quantity, and walkInName are required" },
                { status: 400 }
            );
        }

        const newDispense = await recordDispense({
            med_id,
            quantity: Number(quantity),
            walkIn: {
                name: walkInName,
                contact: walkInContact ?? null,
                notes: walkInNotes ?? null,
            },
            scholar_user_id: scholar.user_id,
        });

        return NextResponse.json(newDispense);
    } catch (err) {
        if (err instanceof DispenseError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }

        console.error("POST /api/scholar/dispense error:", err);
        return NextResponse.json({ error: "Failed to record walk-in dispense" }, { status: 500 });
    }
}
