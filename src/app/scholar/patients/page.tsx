import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

import ScholarPatientsLoading from "./loading";
import { ScholarPatientsPageClient } from "./page.client";
import { preparePatientRecords, type PatientRecord } from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function ScholarPatientsPage() {
    noStore();
    const params = new URLSearchParams({ type: "all", status: "all" });
    const initialRecords = await serverFetch<PatientRecord[]>(`/api/scholar/patients?${params.toString()}`);
    const preparedRecords = preparePatientRecords(initialRecords ?? []);

    return (
        <Suspense fallback={<ScholarPatientsLoading />}>
            <ScholarPatientsPageClient
                initialRecords={preparedRecords}
                initialLoaded={Array.isArray(initialRecords)}
            />
        </Suspense>
    );
}
