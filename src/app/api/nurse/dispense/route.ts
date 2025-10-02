import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ GET: Fetch all dispenses with consultation + patient + clinic info + batch usage
export async function GET() {
    try {
        const dispenses = await prisma.medDispense.findMany({
            include: {
                med: {
                    include: {
                        clinic: { select: { clinic_name: true } }, // ✅ show clinic
                    },
                },
                consultation: {
                    include: {
                        appointment: {
                            include: {
                                patient: { select: { username: true } }, // ✅ patient
                                clinic: { select: { clinic_name: true } }, // ✅ appointment clinic
                            },
                        },
                        doctor: { select: { username: true } },
                        nurse: { select: { username: true } },
                    },
                },
                dispenseBatches: {   // 👈 matches your Prisma schema
                    include: {
                        replenishment: {
                            select: {
                                expiry_date: true,
                                date_received: true,
                            },
                        },
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

// ✅ POST: Record a new dispense with FIFO (earliest expiry first) + batch logging
export async function POST(req: Request) {
    try {
        const { med_id, consultation_id, quantity } = await req.json();

        if (!med_id || !consultation_id || !quantity) {
            return NextResponse.json(
                { error: "med_id, consultation_id, and quantity are required" },
                { status: 400 }
            );
        }

        const qtyNeeded = Number(quantity);
        if (qtyNeeded <= 0) {
            return NextResponse.json(
                { error: "Quantity must be greater than 0" },
                { status: 400 }
            );
        }

        // 🔎 Get medicine and available batches (FIFO by expiry)
        const med = await prisma.medInventory.findUnique({
            where: { med_id },
            include: {
                replenishments: {
                    where: { remaining_qty: { gt: 0 } },
                    orderBy: { expiry_date: "asc" }, // FIFO
                },
            },
        });

        if (!med || med.quantity < qtyNeeded) {
            return NextResponse.json(
                { error: "Not enough stock available" },
                { status: 400 }
            );
        }

        let qtyToDeduct = qtyNeeded;
        const updates: ReturnType<typeof prisma.replenishment.update>[] = [];
        const batchRecords: { replenishment_id: string; quantity_used: number }[] = [];

        // ✅ FIFO: Deduct from earliest expiry replenishments first
        for (const batch of med.replenishments) {
            if (qtyToDeduct <= 0) break;

            const deduct = Math.min(batch.remaining_qty, qtyToDeduct);

            updates.push(
                prisma.replenishment.update({
                    where: { replenishment_id: batch.replenishment_id },
                    data: { remaining_qty: { decrement: deduct } },
                })
            );

            batchRecords.push({
                replenishment_id: batch.replenishment_id,
                quantity_used: deduct,
            });

            qtyToDeduct -= deduct;
        }

        if (qtyToDeduct > 0) {
            return NextResponse.json(
                { error: "Insufficient stock after batch allocation" },
                { status: 400 }
            );
        }

        // ✅ Transaction: update inventory total, update batches, record dispense + batch records
        const [newDispense] = await prisma.$transaction([
            prisma.medInventory.update({
                where: { med_id },
                data: { quantity: { decrement: qtyNeeded } },
            }),
            ...updates,
            prisma.medDispense.create({
                data: {
                    med_id,
                    consultation_id,
                    quantity: qtyNeeded,
                    dispenseBatches: { create: batchRecords }, // 👈 matches schema
                },
                include: {
                    med: { include: { clinic: { select: { clinic_name: true } } } },
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
                    dispenseBatches: {
                        include: {
                            replenishment: {
                                select: { expiry_date: true, date_received: true },
                            },
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
