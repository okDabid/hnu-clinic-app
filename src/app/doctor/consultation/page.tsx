import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

import DoctorConsultationLoading from "./loading";
import { DoctorConsultationPageClient } from "./page.client";
import {
    normalizeConsultationSlots,
    type Clinic,
    type SlotsResponse,
} from "./types";
import { serverFetch } from "@/lib/server-api";

export default async function DoctorConsultationPage() {
    noStore();
    const [initialSlotsResponse, initialClinicsResponse] = await Promise.all([
        serverFetch<SlotsResponse>(`/api/doctor/consultation?page=1&pageSize=25`),
        serverFetch<Clinic[]>("/api/meta/clinics"),
    ]);

    const normalizedSlots = normalizeConsultationSlots(initialSlotsResponse, 1);
    const clinics = Array.isArray(initialClinicsResponse) ? initialClinicsResponse : [];

    return (
        <Suspense fallback={<DoctorConsultationLoading />}>
            <DoctorConsultationPageClient
                initialSlots={normalizedSlots}
                initialClinics={clinics}
                initialSlotsLoaded={Boolean(initialSlotsResponse)}
                initialClinicsLoaded={Array.isArray(initialClinicsResponse)}
            />
        </Suspense>
    );
}
