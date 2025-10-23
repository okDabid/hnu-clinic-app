import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

import NurseReportsLoading from "./loading";
import { NurseReportsPageClient } from "./page.client";
import { getInitialReportSelection, type ReportsResponse } from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function NurseReportsPage() {
    noStore();
    const { year, quarter } = getInitialReportSelection();
    const params = new URLSearchParams({ year: String(year), quarter: String(quarter) });
    const initialReports = await serverFetch<ReportsResponse>(`/api/nurse/reports?${params.toString()}`);

    return (
        <Suspense fallback={<NurseReportsLoading />}>
            <NurseReportsPageClient
                initialYear={year}
                initialQuarter={quarter}
                initialReports={initialReports}
            />
        </Suspense>
    );
}
