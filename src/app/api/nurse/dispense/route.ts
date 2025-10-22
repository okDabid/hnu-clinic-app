import { NextResponse } from "next/server";
import { listDispenses, recordDispense, DispenseError } from "@/lib/dispense";

export async function GET() {
    try {
        const dispenses = await listDispenses();
        return NextResponse.json(dispenses);
    } catch (err) {
        console.error("GET /api/nurse/dispense error:", err);
        return NextResponse.json(
            { error: "Failed to load dispenses" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const { med_id, consultation_id, quantity, walkInName, walkInContact, walkInNotes } = await req.json();

        if (!med_id || quantity === undefined) {
            return NextResponse.json(
                { error: "med_id and quantity are required" },
                { status: 400 }
            );
        }

        if (!consultation_id && !walkInName) {
            return NextResponse.json(
                { error: "Provide a consultation_id or walk-in name" },
                { status: 400 }
            );
        }

        const newDispense = await recordDispense({
            med_id,
            consultation_id: consultation_id ?? null,
            quantity: Number(quantity),
            walkIn: walkInName
                ? {
                    name: walkInName,
                    contact: walkInContact ?? null,
                    notes: walkInNotes ?? null,
                }
                : undefined,
        });
        return NextResponse.json(newDispense);
    } catch (err) {
        if (err instanceof DispenseError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }

        console.error("POST /api/nurse/dispense error:", err);
        return NextResponse.json(
            { error: "Failed to record dispense" },
            { status: 500 }
        );
    }
}