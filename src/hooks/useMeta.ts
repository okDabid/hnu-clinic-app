import { useMemo } from "react";
import useSWR from "swr";

import type { TimeSlot } from "@/lib/doctor-availability";

export type ClinicMeta = { clinic_id: string; clinic_name: string };
export type DoctorMeta = {
    user_id: string;
    name: string;
    specialization: "Physician" | "Dentist" | null;
};

export function useMetaClinics() {
    const swr = useSWR<ClinicMeta[]>("/api/meta/clinics", { keepPreviousData: true });

    return {
        clinics: swr.data ?? [],
        isLoading: swr.isLoading,
        isValidating: swr.isValidating,
        error: swr.error,
        refresh: swr.mutate,
    };
}

export function useMetaDoctors(clinicId: string | null | undefined) {
    const key = clinicId ? `/api/meta/doctors?clinic_id=${encodeURIComponent(clinicId)}` : null;
    const swr = useSWR<DoctorMeta[]>(key, {
        keepPreviousData: false,
        revalidateOnReconnect: true,
    });

    return {
        doctors: swr.data ?? [],
        isLoading: key ? swr.isLoading : false,
        isValidating: key ? swr.isValidating : false,
        error: key ? swr.error : undefined,
        refresh: swr.mutate,
    };
}

interface DoctorAvailabilityArgs {
    clinicId?: string | null;
    date?: string | null;
    doctorIds: string[];
}

export function useDoctorAvailabilityBulk({ clinicId, date, doctorIds }: DoctorAvailabilityArgs) {
    const normalizedDoctorIds = useMemo(() => {
        const filtered = doctorIds.filter((value): value is string => Boolean(value));
        const unique = Array.from(new Set(filtered));
        unique.sort();
        return unique;
    }, [doctorIds]);

    const key = useMemo(() => {
        if (!clinicId || !date || normalizedDoctorIds.length === 0) {
            return null;
        }
        const params = new URLSearchParams({
            clinic_id: clinicId,
            date,
            doctor_user_ids: normalizedDoctorIds.join(","),
        });
        return `/api/meta/doctor-availability/bulk?${params.toString()}`;
    }, [clinicId, date, normalizedDoctorIds]);

    const swr = useSWR<{ availability: Record<string, TimeSlot[]> }>(key, {
        keepPreviousData: false,
        revalidateOnReconnect: false,
        revalidateOnFocus: false,
    });

    const availability = key ? swr.data?.availability ?? {} : {};

    return {
        availabilityByDoctor: availability,
        isLoading: key ? swr.isLoading : false,
        isValidating: key ? swr.isValidating : false,
        error: key ? swr.error : undefined,
        refresh: swr.mutate,
    };
}
