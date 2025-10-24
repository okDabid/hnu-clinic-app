import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import DoctorConsultationLoading from "./loading";
import { DoctorConsultationPageClient } from "./page.client";
import { normalizeConsultationSlots, type Clinic, type SlotsResponse } from "./types";
import { authOptions } from "@/lib/auth";
import { archiveExpiredDutyHours } from "@/lib/duty-hours";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

function serializeSlot(slot: {
    availability_id: string;
    available_date: Date;
    available_timestart: Date;
    available_timeend: Date;
    is_on_leave: boolean;
    clinic: { clinic_id: string; clinic_name: string };
}) {
    return {
        availability_id: slot.availability_id,
        available_date: slot.available_date.toISOString(),
        available_timestart: slot.available_timestart.toISOString(),
        available_timeend: slot.available_timeend.toISOString(),
        is_on_leave: slot.is_on_leave,
        clinic: slot.clinic,
    };
}

export default async function DoctorConsultationPage() {
    noStore();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/login");
    }

    const doctor = await prisma.users.findUnique({
        where: { user_id: session.user.id },
        select: { user_id: true, role: true },
    });

    if (!doctor || doctor.role !== Role.DOCTOR) {
        redirect("/login");
    }

    await archiveExpiredDutyHours({ doctor_user_id: doctor.user_id });

    const where = { doctor_user_id: doctor.user_id, archivedAt: null } as const;

    const [slotsRaw, clinicsRaw] = await Promise.all([
        prisma.doctorAvailability.findMany({
            where,
            include: { clinic: { select: { clinic_id: true, clinic_name: true } } },
            orderBy: [{ available_date: "asc" }, { available_timestart: "asc" }],
        }),
        prisma.clinic.findMany({
            select: { clinic_id: true, clinic_name: true },
            orderBy: { clinic_name: "asc" },
        }),
    ]);

    const slotsResponse: SlotsResponse = {
        data: slotsRaw.map(serializeSlot),
        total: slotsRaw.length,
        totalPages: 1,
        page: 1,
        pageSize: slotsRaw.length > 0 ? slotsRaw.length : undefined,
    };

    const normalizedSlots = normalizeConsultationSlots(slotsResponse, 1);
    const clinics: Clinic[] = clinicsRaw;

    return (
        <Suspense fallback={<DoctorConsultationLoading />}>
            <DoctorConsultationPageClient
                initialSlots={normalizedSlots}
                initialClinics={clinics}
                initialSlotsLoaded={true}
                initialClinicsLoaded={true}
            />
        </Suspense>
    );
}
