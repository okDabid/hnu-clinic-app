import { NextResponse } from "next/server";
import { MedCategory, DosageUnit } from "@prisma/client";

export async function GET() {
    return NextResponse.json({
        categories: Object.values(MedCategory),
        units: Object.values(DosageUnit),
    });
}
