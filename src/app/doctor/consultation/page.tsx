import { unstable_noStore as noStore } from "next/cache";

import { DoctorConsultationPageClient } from "./page.client";
import type { DoctorConsultationPageClientProps } from "./page.client";
import { serverFetch } from "@/lib/server-api";

export default async function DoctorConsultationPage() {
    noStore();
    const [initialSlots, initialClinics] = await Promise.all([
        serverFetch<DoctorConsultationPageClientProps["initialSlots"]>(
            `/api/doctor/consultation?page=1&pageSize=25`
        ),
        serverFetch<DoctorConsultationPageClientProps["initialClinics"]>("/api/meta/clinics"),
    ]);

    return (
        <DoctorConsultationPageClient initialSlots={initialSlots} initialClinics={initialClinics} />
    );
}
