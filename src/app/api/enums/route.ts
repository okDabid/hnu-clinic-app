import { NextResponse } from "next/server";
import { MedCategory, DosageUnit, MedType } from "@prisma/client";

export async function GET() {
    return NextResponse.json({
        categories: Object.values(MedCategory),
        units: Object.values(DosageUnit),
        medTypes: Object.values(MedType),
    });
}
