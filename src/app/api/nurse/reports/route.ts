import { NextRequest, NextResponse } from "next/server";

import { getQuarterlyReports, QUARTERS } from "./helpers";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const yearParam = Number.parseInt(searchParams.get("year") ?? "", 10);
    const quarterParam = Number.parseInt(searchParams.get("quarter") ?? "", 10);

    const year = Number.isNaN(yearParam) ? undefined : yearParam;
    const quarter = Number.isNaN(quarterParam)
        ? undefined
        : QUARTERS.includes(quarterParam as (typeof QUARTERS)[number])
        ? (quarterParam as (typeof QUARTERS)[number])
        : undefined;

    const reports = await getQuarterlyReports({ year, quarter });

    return NextResponse.json(reports);
}
