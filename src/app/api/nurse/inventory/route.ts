import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ GET: Fetch inventory with ALL expiry batches & auto-mark expired
export async function GET() {
    try {
        const now = new Date();

        // 🔎 Find all expired replenishments that still have stock
        const expiredReplenishments = await prisma.replenishment.findMany({
            where: {
                expiry_date: { lt: now },
                remaining_qty: { gt: 0 },
            },
        });

        let totalExpiredDeducted = 0;

        if (expiredReplenishments.length > 0) {
            // ✅ Run all expiry updates in one transaction
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

        // ✅ Fetch inventory with ALL replenishments and clinic info
        const inventory = await prisma.medInventory.findMany({
            include: {
                clinic: {
                    select: {
                        clinic_name: true,
                        clinic_location: true,
                    },
                },
                replenishments: {
                    orderBy: { expiry_date: "asc" },
                },
            },
        });

        // 👇 Transform response: tag replenishments with status
        const result = inventory.map((item) => ({
            ...item,
            replenishments: item.replenishments.map((r) => {
                const isExpired = r.expiry_date < now;
                const daysLeft = Math.ceil((r.expiry_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                return {
                    ...r,
                    status: isExpired
                        ? "Expired"
                        : daysLeft <= 30
                            ? "Expiring Soon"
                            : "Valid",
                    daysLeft,
                };
            }),
        }));

        return NextResponse.json({ inventory: result, expiredDeducted: totalExpiredDeducted });
    } catch (err) {
        console.error("GET /api/nurse/inventory error:", err);
        return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
    }
}

// ✅ POST: Add stock or auto-replenish if item already exists
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { clinic_id, item_name, quantity, expiry } = body as {
            clinic_id: string;
            item_name: string;
            quantity: number | string;
            expiry: string;
        };

        // 🔒 Validate required fields
        if (!clinic_id || !item_name || !quantity || !expiry) {
            return NextResponse.json(
                { error: "All fields (clinic_id, item_name, quantity, expiry) are required" },
                { status: 400 }
            );
        }

        if (Number(quantity) <= 0) {
            return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
        }

        const expiryDate = new Date(expiry);
        if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
            return NextResponse.json(
                { error: "Expiry date must be valid and in the future" },
                { status: 400 }
            );
        }

        // 🔎 Check clinic exists
        const clinicExists = await prisma.clinic.findUnique({
            where: { clinic_id },
        });
        if (!clinicExists) {
            return NextResponse.json({ error: "Clinic does not exist" }, { status: 404 });
        }

        // 🔎 Check if item already exists in this clinic
        const existingItem = await prisma.medInventory.findFirst({
            where: { clinic_id, item_name },
        });

        if (existingItem) {
            // ✅ Auto-replenishment
            const updatedItem = await prisma.medInventory.update({
                where: { med_id: existingItem.med_id },
                data: {
                    quantity: { increment: Number(quantity) },
                    replenishments: {
                        create: {
                            quantity_added: Number(quantity),
                            remaining_qty: Number(quantity),
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

        // 📝 Create new item if not found
        const newItem = await prisma.medInventory.create({
            data: {
                clinic_id,
                item_name,
                quantity: Number(quantity),
                replenishments: {
                    create: {
                        quantity_added: Number(quantity),
                        remaining_qty: Number(quantity),
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
        console.error("POST /api/nurse/inventory error:", err);
        return NextResponse.json({ error: "Failed to add stock" }, { status: 500 });
    }
}
