import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MedCategory, MedType, DosageUnit, Role } from "@prisma/client";
import { handleAuthError, requireRole } from "@/lib/authorization";

// GET stays the same (no changes)
export async function GET() {
    try {
        await requireRole([Role.NURSE]);

        const now = new Date();

        const expiredReplenishments = await prisma.replenishment.findMany({
            where: { expiry_date: { lt: now }, remaining_qty: { gt: 0 } },
            include: {
                med: {
                    select: {
                        med_id: true,
                        item_name: true,
                        category: true,
                        item_type: true,
                        strength: true,
                        unit: true,
                        clinic: { select: { clinic_name: true, clinic_location: true } },
                    },
                },
            },
        });

        const newlyArchived = new Map(
            expiredReplenishments.map((rep) => [
                rep.replenishment_id,
                {
                    quantity_archived: rep.remaining_qty,
                    archivedAt: now.toISOString(),
                },
            ])
        );

        let totalExpiredDeducted = 0;

        if (expiredReplenishments.length > 0) {
            const ops = expiredReplenishments.flatMap((rep) => {
                totalExpiredDeducted += rep.remaining_qty;
                return [
                    prisma.medInventory.update({
                        where: { med_id: rep.med_id },
                        data: { quantity: { decrement: rep.remaining_qty } },
                    }),
                    prisma.replenishment.update({
                        where: { replenishment_id: rep.replenishment_id },
                        data: { remaining_qty: 0 },
                    }),
                ];
            });

            await prisma.$transaction(ops);
        }

        const [
            inventory,
            archivedReplenishments,
            dispenseTotals,
            walkInDispenses,
            dispensedByReplenishment,
        ] = await Promise.all([
            prisma.medInventory.findMany({
                include: {
                    clinic: { select: { clinic_name: true, clinic_location: true } },
                    replenishments: { orderBy: { expiry_date: "asc" } },
                },
            }),
            prisma.replenishment.findMany({
                where: { expiry_date: { lt: now } },
                include: {
                    med: {
                        select: {
                            med_id: true,
                            item_name: true,
                            category: true,
                            item_type: true,
                            strength: true,
                            unit: true,
                            clinic: { select: { clinic_name: true, clinic_location: true } },
                        },
                    },
                },
                orderBy: { expiry_date: "desc" },
            }),
            prisma.medDispense.groupBy({
                by: ["med_id"],
                _sum: { quantity: true },
            }),
            prisma.medDispense.groupBy({
                by: ["med_id"],
                where: { consultation_id: null },
                _sum: { quantity: true },
            }),
            prisma.dispenseBatch.groupBy({
                by: ["replenishment_id"],
                _sum: { quantity_used: true },
            }),
        ]);

        const totalDispensedMap = new Map(
            dispenseTotals.map((record) => [record.med_id, record._sum.quantity ?? 0])
        );
        const walkInDispensedMap = new Map(
            walkInDispenses.map((record) => [record.med_id, record._sum.quantity ?? 0])
        );
        const dispensedFromReplenishmentMap = new Map(
            dispensedByReplenishment.map((record) => [
                record.replenishment_id,
                record._sum.quantity_used ?? 0,
            ])
        );

        const archived = archivedReplenishments.map((rep) => ({
            replenishment_id: rep.replenishment_id,
            med_id: rep.med_id,
            item_name: rep.med?.item_name ?? "",
            category: rep.med?.category ?? null,
            item_type: rep.med?.item_type ?? null,
            strength: rep.med?.strength ?? null,
            unit: rep.med?.unit ?? null,
            clinic: rep.med?.clinic
                ? {
                    clinic_name: rep.med.clinic.clinic_name,
                    clinic_location: rep.med.clinic.clinic_location,
                }
                : null,
            expiry_date: rep.expiry_date,
            quantity_archived:
                newlyArchived.get(rep.replenishment_id)?.quantity_archived ??
                Math.max(
                    rep.quantity_added - (dispensedFromReplenishmentMap.get(rep.replenishment_id) ?? 0),
                    0
                ),
            archivedAt:
                newlyArchived.get(rep.replenishment_id)?.archivedAt ??
                rep.expiry_date.toISOString(),
        }));

        const archivedByMed = archived.reduce<Record<string, typeof archived[number][]>>((acc, rep) => {
            if (!acc[rep.med_id]) acc[rep.med_id] = [];
            acc[rep.med_id].push(rep);
            return acc;
        }, {});

        const VERY_SOON_THRESHOLD_DAYS = 7;
        const SOON_THRESHOLD_DAYS = 30;

        const result = inventory.map((item) => {
            const activeReplenishments = item.replenishments
                .filter((r) => r.expiry_date >= now && r.remaining_qty > 0)
                .map((r) => {
                    const daysLeft = Math.ceil((r.expiry_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return {
                        ...r,
                        status:
                            daysLeft < 0
                                ? "Expired"
                                : daysLeft <= VERY_SOON_THRESHOLD_DAYS
                                    ? "Expiring Very Soon"
                                    : daysLeft <= SOON_THRESHOLD_DAYS
                                        ? "Expiring Soon"
                                        : "Valid",
                        daysLeft,
                    };
                });

            return {
                ...item,
                replenishments: activeReplenishments,
                archivedReplenishments: archivedByMed[item.med_id] ?? [],
                totalDispensed: totalDispensedMap.get(item.med_id) ?? 0,
                walkInDispensed: walkInDispensedMap.get(item.med_id) ?? 0,
            };
        });

        return NextResponse.json({ inventory: result, archived, expiredDeducted: totalExpiredDeducted });
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("GET /api/nurse/inventory error:", err);
        return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
    }
}

// POST updated to support enums + strength
export async function POST(req: Request) {
    try {
        await requireRole([Role.NURSE]);

        const body = await req.json();
        const { clinic_id, item_name, quantity, expiry, category, item_type, strength, unit } = body as {
            clinic_id: string;
            item_name: string;
            quantity: number | string;
            expiry: string;
            category?: MedCategory;
            item_type?: MedType;
            strength?: number | string;
            unit?: DosageUnit;
        };

        // Validate required fields
        if (!clinic_id || !item_name || !quantity || !expiry) {
            return NextResponse.json(
                { error: "Required fields: clinic_id, item_name, quantity, expiry" },
                { status: 400 }
            );
        }

        const normalizedQuantity = Number(quantity);
        const normalizedStrength = strength !== undefined ? Number(strength) : null;
        const normalizedCategory = category ? (category as MedCategory) : MedCategory.Analgesic;
        const normalizedItemType = item_type ? (item_type as MedType) : MedType.Tablet;
        const normalizedUnit = unit ? (unit as DosageUnit) : null;

        if (normalizedQuantity <= 0) {
            return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
        }

        if (normalizedStrength !== null && normalizedStrength < 0) {
            return NextResponse.json({ error: "Strength cannot be negative" }, { status: 400 });
        }

        const expiryDate = new Date(expiry);
        if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
            return NextResponse.json({ error: "Expiry date must be valid and in the future" }, { status: 400 });
        }

        const clinicExists = await prisma.clinic.findUnique({ where: { clinic_id } });
        if (!clinicExists) {
            return NextResponse.json({ error: "Clinic does not exist" }, { status: 404 });
        }

        // Check if item already exists in this clinic (same identifying attributes)
        const itemsWithSameName = await prisma.medInventory.findMany({
            where: { clinic_id, item_name },
        });

        const matchingItem = itemsWithSameName.find(
            (item) =>
                item.category === normalizedCategory &&
                item.item_type === normalizedItemType &&
                item.strength === normalizedStrength &&
                item.unit === normalizedUnit
        );

        if (!matchingItem && itemsWithSameName.length > 0) {
            const existing = itemsWithSameName[0];
            return NextResponse.json(
                {
                    error:
                        `An item named "${item_name}" already exists in this clinic with category ${existing.category}, type ${existing.item_type}, strength ${existing.strength ?? "N/A"}, and unit ${existing.unit ?? "N/A"}. ` +
                        "Please create a separate inventory item for this variation.",
                },
                { status: 400 }
            );
        }

        if (matchingItem) {
            const existingReplenishment = await prisma.replenishment.findFirst({
                where: { med_id: matchingItem.med_id, expiry_date: expiryDate },
            });

            if (existingReplenishment) {
                const [, , updatedItem] = await prisma.$transaction([
                    prisma.medInventory.update({
                        where: { med_id: matchingItem.med_id },
                        data: { quantity: { increment: normalizedQuantity } },
                    }),
                    prisma.replenishment.update({
                        where: { replenishment_id: existingReplenishment.replenishment_id },
                        data: {
                            quantity_added: { increment: normalizedQuantity },
                            remaining_qty: { increment: normalizedQuantity },
                            date_received: new Date(),
                        },
                    }),
                    prisma.medInventory.findUnique({
                        where: { med_id: matchingItem.med_id },
                        include: {
                            clinic: { select: { clinic_name: true, clinic_location: true } },
                            replenishments: { orderBy: { expiry_date: "asc" } },
                        },
                    }),
                ]);

                return NextResponse.json(updatedItem);
            }

            const updatedItem = await prisma.medInventory.update({
                where: { med_id: matchingItem.med_id },
                data: {
                    quantity: { increment: normalizedQuantity },
                    replenishments: {
                        create: {
                            quantity_added: normalizedQuantity,
                            remaining_qty: normalizedQuantity,
                            date_received: new Date(),
                            expiry_date: expiryDate,
                        },
                    },
                },
                include: {
                    clinic: { select: { clinic_name: true, clinic_location: true } },
                    replenishments: { orderBy: { expiry_date: "asc" } },
                },
            });

            return NextResponse.json(updatedItem);
        }

        // Create new item with enums + optional strength/unit
        const newItem = await prisma.medInventory.create({
            data: {
                clinic_id,
                item_name,
                quantity: normalizedQuantity,
                category: normalizedCategory,
                item_type: normalizedItemType,
                strength: normalizedStrength,
                unit: normalizedUnit,
                replenishments: {
                    create: {
                        quantity_added: normalizedQuantity,
                        remaining_qty: normalizedQuantity,
                        date_received: new Date(),
                        expiry_date: expiryDate,
                    },
                },
            },
            include: {
                clinic: { select: { clinic_name: true, clinic_location: true } },
                replenishments: { orderBy: { expiry_date: "asc" } },
            },
        });

        return NextResponse.json(newItem);
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;
        console.error("POST /api/nurse/inventory error:", err);
        return NextResponse.json({ error: "Failed to add stock" }, { status: 500 });
    }
}
