import { unstable_noStore as noStore } from "next/cache";

import { ScholarPatientsPageClient } from "./page.client";
import type { PatientRecord } from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function ScholarPatientsPage() {
    noStore();
    const params = new URLSearchParams({ type: "all", status: "all" });
    const initialRecords = await serverFetch<PatientRecord[]>(`/api/scholar/patients?${params.toString()}`);

    return <ScholarPatientsPageClient initialRecords={initialRecords} />;
}
