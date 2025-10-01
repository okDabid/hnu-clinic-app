import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch inventory with nearest expiry
export async function GET() {
    try {
        const inventory = await prisma.medInventory.findMany({
            include: {
                replenishments: {
                    orderBy: { expiry_date: "asc" },
                    take: 1,
                },
            },
        });

        return NextResponse.json(inventory);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
    }
}

// POST: Add a new stock item
export async function POST(req: Request) {
    try {
        const { clinic_id, name, quantity, expiry } = await req.json();

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
            include: { replenishments: true },
        });

        return NextResponse.json(newItem);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to add stock" }, { status: 500 });
    }
}
