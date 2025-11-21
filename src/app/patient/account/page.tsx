import { unstable_noStore as noStore } from "next/cache";
import { PatientAccountPageClient } from "./page.client";
import { normalizePatientAccountProfile, type PatientAccountProfileApi } from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function PatientAccountPage() {
    noStore();
    let normalized: ReturnType<typeof normalizePatientAccountProfile> = {
        profile: null,
        type: null,
    };

    try {
        const initialProfile = await serverFetch<PatientAccountProfileApi>("/api/patient/account/me");
        normalized = normalizePatientAccountProfile(initialProfile);
    } catch (error) {
        console.error("Failed to fetch patient account profile", error);
    }

    return (
        <PatientAccountPageClient
            initialProfile={normalized.profile}
            initialPatientType={normalized.type}
            initialProfileLoaded={Boolean(normalized.profile)}
        />
    );
}
