import { NextResponse } from "next/server";

import { fetchPatientRecords } from "@/lib/patient-records";

export async function GET() {
    try {
        const records = await fetchPatientRecords();
        return NextResponse.json(records);
    } catch (err) {
        console.error("[GET /api/nurse/records]", err);
        return NextResponse.json(
            { error: "Failed to fetch patient records" },
            { status: 500 }
        );
    }
}
