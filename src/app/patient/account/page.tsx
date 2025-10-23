import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

import PatientAccountLoading from "./loading";
import { PatientAccountPageClient } from "./page.client";
import { normalizePatientAccountProfile, type PatientAccountProfileApi } from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function PatientAccountPage() {
    noStore();
    const initialProfile = await serverFetch<PatientAccountProfileApi>("/api/patient/account/me");

    const normalized = normalizePatientAccountProfile(initialProfile);

    return (
        <Suspense fallback={<PatientAccountLoading />}>
            <PatientAccountPageClient
                initialProfile={normalized.profile}
                initialPatientType={normalized.type}
                initialProfileLoaded={Boolean(normalized.profile)}
            />
        </Suspense>
    );
}
