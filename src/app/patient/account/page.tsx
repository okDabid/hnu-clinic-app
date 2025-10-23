import { unstable_noStore as noStore } from "next/cache";

import { PatientAccountPageClient } from "./page.client";
import type { PatientAccountProfileApi } from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function PatientAccountPage() {
    noStore();
    const initialProfile = await serverFetch<PatientAccountProfileApi>("/api/patient/account/me");

    return <PatientAccountPageClient initialProfile={initialProfile} />;
}
