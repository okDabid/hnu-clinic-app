import { unstable_noStore as noStore } from "next/cache";

import { NurseRecordsPageClient } from "./page.client";
import type { PatientRecord } from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function NurseRecordsPage() {
    noStore();
    const initialRecords = await serverFetch<PatientRecord[]>("/api/nurse/records");

    return <NurseRecordsPageClient initialRecords={initialRecords} />;
}
