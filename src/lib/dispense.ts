import { prisma } from "@/lib/prisma";

export type DispenseWithRelations = Awaited<ReturnType<typeof listDispenses>>[number];

export class DispenseError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
        this.name = "DispenseError";
    }
}

export async function listDispenses() {
    return prisma.medDispense.findMany({
        include: {
            med: {
                include: {
                    clinic: { select: { clinic_name: true } },
                },
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
            dispenseBatches: {
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
}

export async function recordDispense({
    med_id,
    consultation_id,
    quantity,
}: {
    med_id: string;
    consultation_id: string;
    quantity: number;
}) {
    if (!med_id || !consultation_id) {
        throw new DispenseError("med_id and consultation_id are required", 400);
    }

    const qtyNeeded = Number(quantity);
    if (!Number.isFinite(qtyNeeded) || qtyNeeded <= 0) {
        throw new DispenseError("Quantity must be a positive number", 400);
    }

    const now = new Date();

    const med = await prisma.medInventory.findUnique({
        where: { med_id },
        include: {
            replenishments: {
                where: {
                    remaining_qty: { gt: 0 },
                    expiry_date: { gte: now },
                },
                orderBy: { expiry_date: "asc" },
            },
        },
    });

    if (!med) {
        throw new DispenseError("Medicine not found", 404);
    }

    if (med.replenishments.length === 0) {
        throw new DispenseError("No unexpired stock available", 400);
    }

    const totalAvailable = med.replenishments.reduce((total, batch) => total + batch.remaining_qty, 0);
    if (totalAvailable < qtyNeeded) {
        throw new DispenseError("Not enough unexpired stock available", 400);
    }

    let qtyToDeduct = qtyNeeded;
    const batchUpdates: ReturnType<typeof prisma.replenishment.update>[] = [];
    const batchRecords: { replenishment_id: string; quantity_used: number }[] = [];

    for (const batch of med.replenishments) {
        if (qtyToDeduct <= 0) break;

        const deduct = Math.min(batch.remaining_qty, qtyToDeduct);

        batchUpdates.push(
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
        throw new DispenseError("Insufficient stock after batch allocation", 400);
    }

    const transactionOps = [
        prisma.medInventory.update({
            where: { med_id },
            data: { quantity: { decrement: qtyNeeded } },
        }),
        ...batchUpdates,
        prisma.medDispense.create({
            data: {
                med_id,
                consultation_id,
                quantity: qtyNeeded,
                dispenseBatches: { create: batchRecords },
            },
            include: {
                med: {
                    include: {
                        clinic: { select: { clinic_name: true } },
                    },
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
                dispenseBatches: {
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
        }),
    ];

    const results = await prisma.$transaction(transactionOps);
    const createdDispense = results[results.length - 1];

    if (!createdDispense || !("dispense_id" in createdDispense)) {
        throw new DispenseError("Failed to create dispense record", 500);
    }

    return createdDispense;
}