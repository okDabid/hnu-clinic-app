import { NextRequest, NextResponse } from "next/server";

import {
    generateNurseQuarterlyReport,
    NURSE_REPORT_QUARTERS,
    type QuarterNumber,
} from "@/lib/reports/nurse-quarterly";

function parseQuarter(value: string | null): QuarterNumber | undefined {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return NURSE_REPORT_QUARTERS.includes(parsed as QuarterNumber)
        ? (parsed as QuarterNumber)
        : undefined;
}

function parseYear(value: string | null): number | undefined {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const requestedYear = parseYear(searchParams.get("year"));
    const requestedQuarter = parseQuarter(searchParams.get("quarter"));

    try {
        const report = await generateNurseQuarterlyReport({
            year: requestedYear,
            quarter: requestedQuarter,
        });

        return NextResponse.json(report);
    } catch (err) {
        console.error("[GET /api/nurse/reports]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to load reports" },
            { status: 500 }
        );
    }
}
