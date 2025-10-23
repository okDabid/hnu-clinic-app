import { DoctorSpecialization } from "@prisma/client";

import { formatManilaISODate, getManilaWeekday, startOfManilaDay } from "@/lib/time";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_MIN_BOOKING_LEAD_DAYS = 3;

function shouldSkipDay(weekday: number, specialization: DoctorSpecialization | null | undefined) {
    if (Number.isNaN(weekday)) return true;

    if (weekday === 0) return true; // Always skip Sundays

    if (specialization === DoctorSpecialization.Dentist) {
        return false; // Dentists may book Saturdays
    }

    return weekday === 6; // Physicians skip Saturdays
}

export function computeDoctorEarliestBookingStart(
    now: Date,
    specialization: DoctorSpecialization | null | undefined,
    minLeadDays = DEFAULT_MIN_BOOKING_LEAD_DAYS,
): Date {
    let cursor = new Date(now.getTime() + minLeadDays * DAY_IN_MS);

    for (let i = 0; i < 31; i += 1) {
        const isoDate = formatManilaISODate(cursor);
        const weekday = getManilaWeekday(isoDate);

        if (!shouldSkipDay(weekday, specialization)) {
            return startOfManilaDay(isoDate);
        }

        cursor = new Date(cursor.getTime() + DAY_IN_MS);
    }

    const fallbackDate = formatManilaISODate(cursor);
    return startOfManilaDay(fallbackDate);
}
