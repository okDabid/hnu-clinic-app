import { prisma } from "@/lib/prisma";
import { manilaNow } from "@/lib/time";

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
            scholar: {
                select: {
                    user_id: true,
                    username: true,
                    student: {
                        select: {
                            fname: true,
                            mname: true,
                            lname: true,
                        },
                    },
                    employee: {
                        select: {
                            fname: true,
                            mname: true,
                            lname: true,
                        },
                    },
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
        orderBy: { createdAt: "desc" },
    });
}

export async function recordDispense({
    med_id,
    consultation_id,
    quantity,
    walkIn,
    scholar_user_id,
}: {
    med_id: string;
    consultation_id?: string | null;
    quantity: number;
    walkIn?: {
        idNumber: string;
        contact?: string | null;
        notes?: string | null;
    };
    scholar_user_id?: string | null;
}) {
    if (!med_id) {
        throw new DispenseError("med_id is required", 400);
    }

    const walkInIdNumber = walkIn?.idNumber?.trim();
    const walkInContact = walkIn?.contact ? walkIn.contact.trim() : null;
    const walkInNotes = walkIn?.notes ? walkIn.notes.trim() : null;

    const hasConsultation = Boolean(consultation_id);
    const hasWalkIn = Boolean(walkInIdNumber);

    if (!hasConsultation && !hasWalkIn) {
        throw new DispenseError("Either consultation_id or walk-in details are required", 400);
    }

    if (hasConsultation && hasWalkIn) {
        throw new DispenseError("Provide either consultation_id or walk-in details, not both", 400);
    }

    if (hasWalkIn && !scholar_user_id) {
        throw new DispenseError("Walk-in dispenses must be associated with a scholar", 400);
    }

    if (hasConsultation && scholar_user_id) {
        throw new DispenseError("scholar_user_id is only allowed for walk-in dispenses", 400);
    }

    const qtyNeeded = Number(quantity);
    if (!Number.isFinite(qtyNeeded) || qtyNeeded <= 0) {
        throw new DispenseError("Quantity must be a positive number", 400);
    }

    const now = new Date();
    const timestamp = manilaNow();

    const med = await prisma.medInventory.findUnique({
        where: { med_id },
        include: {
            replenishments: {
                where: {
                    remaining_qty: { gt: 0 },
                    expiry_date: { gte: now },
                },
                orderBy: [
                    { date_received: "asc" },
                    { expiry_date: "asc" },
                    { replenishment_id: "asc" },
                ],
            },
        },
    });

    if (!med) {
        throw new DispenseError("Medicine not found", 404);
    }

    const availableQty = med.replenishments.reduce(
        (total, batch) => total + batch.remaining_qty,
        0
    );

    if (availableQty < qtyNeeded) {
        throw new DispenseError("Not enough non-expired stock available", 400);
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
        throw new DispenseError("Insufficient unexpired stock after batch allocation", 400);
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
                consultation_id: hasConsultation ? consultation_id : null,
                scholar_user_id: hasWalkIn ? scholar_user_id ?? null : null,
                walk_in_id_number: hasWalkIn ? walkInIdNumber : null,
                walk_in_contact: hasWalkIn ? walkInContact : null,
                walk_in_notes: hasWalkIn ? walkInNotes : null,
                quantity: qtyNeeded,
                createdAt: timestamp,
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
                scholar: {
                    select: {
                        user_id: true,
                        username: true,
                        student: {
                            select: {
                                fname: true,
                                mname: true,
                                lname: true,
                            },
                        },
                        employee: {
                            select: {
                                fname: true,
                                mname: true,
                                lname: true,
                            },
                        },
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

export type DispenseSummary = {
    total: number;
    consultations: number;
    walkIns: number;
    latestDispense: string | null;
    totalQuantity: number;
};

export type DispenseLike = {
    consultation: unknown | null;
    quantity: number;
    createdAt: string;
};

export function summarizeDispenses(records: DispenseLike[]): DispenseSummary {
    let walkIns = 0;
    let latest: string | null = null;
    let totalQuantity = 0;

    for (const record of records) {
        if (!record.consultation) {
            walkIns += 1;
        }

        totalQuantity += Number(record.quantity) || 0;

        if (!latest || new Date(record.createdAt).getTime() > new Date(latest).getTime()) {
            latest = record.createdAt;
        }
    }

    return {
        total: records.length,
        consultations: records.length - walkIns,
        walkIns,
        latestDispense: latest,
        totalQuantity,
    };
}
