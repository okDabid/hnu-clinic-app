import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ GET: Fetch inventory with nearest expiry & auto-mark expired
export async function GET() {
    try {
        // 🔄 Find all expired replenishments that still have stock
        const expiredReplenishments = await prisma.replenishment.findMany({
            where: {
                expiry_date: { lt: new Date() },
                remaining_qty: { gt: 0 },
            },
        });

        // 🔄 Deduct expired quantities from medInventory
        for (const rep of expiredReplenishments) {
            await prisma.$transaction([
                prisma.medInventory.update({
                    where: { med_id: rep.med_id },
                    data: {
                        quantity: { decrement: rep.remaining_qty },
                    },
                }),
                prisma.replenishment.update({
                    where: { replenishment_id: rep.replenishment_id },
                    data: { remaining_qty: 0 },
                }),
            ]);
        }

        // ✅ Now fetch updated inventory (with clinic name)
        const inventory = await prisma.medInventory.findMany({
            include: {
                clinic: {   // 👈 include clinic name for frontend display
                    select: { clinic_name: true },
                },
                replenishments: {
                    orderBy: { expiry_date: "asc" },
                    take: 1, // nearest expiry
                },
            },
        });

        return NextResponse.json(inventory);
    } catch (err) {
        console.error("GET /api/nurse/inventory error:", err);
        return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
    }
}

// ✅ POST: Add stock or auto-replenish if item already exists
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { clinic_id, name, quantity, expiry } = body as {
            clinic_id: string;
            name: string;
            quantity: number | string;
            expiry: string;
        };

        // 🔒 Validate required fields
        if (!clinic_id || !name || !quantity || !expiry) {
            return NextResponse.json(
                { error: "All fields (clinic_id, name, quantity, expiry) are required" },
                { status: 400 }
            );
        }

        // 🔎 Check clinic exists
        const clinicExists = await prisma.clinic.findUnique({
            where: { clinic_id },
        });
        if (!clinicExists) {
            return NextResponse.json(
                { error: "Clinic does not exist" },
                { status: 404 }
            );
        }

        // 🔎 Check if item already exists in this clinic
        const existingItem = await prisma.medInventory.findFirst({
            where: {
                clinic_id,
                item_name: name,
            },
        });

        if (existingItem) {
            // ✅ Auto-replenishment logic
            const updatedItem = await prisma.medInventory.update({
                where: { med_id: existingItem.med_id },
                data: {
                    quantity: existingItem.quantity + Number(quantity),
                    replenishments: {
                        create: {
                            quantity_added: Number(quantity),
                            remaining_qty: Number(quantity),
                            date_received: new Date(),
                            expiry_date: new Date(expiry),
                        },
                    },
                },
                include: {
                    clinic: { select: { clinic_name: true } }, // 👈 include clinic name too
                    replenishments: true,
                },
            });

            return NextResponse.json(updatedItem);
        }

        // 📝 Create new item if not found
        const newItem = await prisma.medInventory.create({
            data: {
                clinic_id,
                item_name: name,
                quantity: Number(quantity),
                replenishments: {
                    create: {
                        quantity_added: Number(quantity),
                        remaining_qty: Number(quantity),
                        date_received: new Date(),
                        expiry_date: new Date(expiry),
                    },
                },
            },
            include: {
                clinic: { select: { clinic_name: true } }, // 👈 include clinic name
                replenishments: true,
            },
        });

        return NextResponse.json(newItem);
    } catch (err) {
        console.error("POST /api/nurse/inventory error:", err);
        return NextResponse.json({ error: "Failed to add stock" }, { status: 500 });
    }
}
