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
        serverFetch<SlotsResponse>(`/api/doctor/consultation?page=1&pageSize=100`),
        serverFetch<Clinic[]>("/api/meta/clinics"),
    ]);

    const normalizedSlots = normalizeConsultationSlots(initialSlotsResponse, 1);
    const combinedSlots = [...normalizedSlots.slots];

    if (normalizedSlots.totalPages > 1) {
        for (let page = 2; page <= normalizedSlots.totalPages; page++) {
            const response = await serverFetch<SlotsResponse>(
                `/api/doctor/consultation?page=${page}&pageSize=100`
            );

            if (!response || response.error) {
                break;
            }

            if (Array.isArray(response.data)) {
                combinedSlots.push(...response.data);
            }
        }
    }

    const aggregatedTotal = Math.max(normalizedSlots.total, combinedSlots.length);

    const aggregatedSlots = {
        ...normalizedSlots,
        slots: combinedSlots,
        total: aggregatedTotal,
        page: 1,
        totalPages: 1,
        pageSize: combinedSlots.length > 0 ? combinedSlots.length : normalizedSlots.pageSize,
    };
    const clinics = Array.isArray(initialClinicsResponse) ? initialClinicsResponse : [];

    return (
        <Suspense fallback={<DoctorConsultationLoading />}>
            <DoctorConsultationPageClient
                initialSlots={aggregatedSlots}
                initialClinics={clinics}
                initialSlotsLoaded={Boolean(initialSlotsResponse)}
                initialClinicsLoaded={Array.isArray(initialClinicsResponse)}
            />
        </Suspense>
    );
}
