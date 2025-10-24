import { toManilaDateString } from "@/lib/time";

import type { Availability } from "./types";

export const MANILA_TIME_SUFFIX = "+08:00";

export function toCalendarDate(value: string | null | undefined) {
    if (!value) return null;
    const normalized = value.includes("T") ? value : `${value}T12:00:00${MANILA_TIME_SUFFIX}`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatMonthKeyFromDate(date: Date): string {
    return date.toLocaleDateString("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
    });
}

export function getMonthKeyFromISODate(value: string): string {
    return value.slice(0, 7);
}

export function sortSlotsForDay(slots: Availability[]): Availability[] {
    return [...slots].sort((a, b) => {
        if (a.is_on_leave && !b.is_on_leave) return -1;
        if (!a.is_on_leave && b.is_on_leave) return 1;
        return a.available_timestart.localeCompare(b.available_timestart);
    });
}

export function mapSlotsByDate(slots: Availability[]) {
    const map = new Map<string, Availability[]>();
    for (const slot of slots) {
        const dateKey = toManilaDateString(slot.available_date);
        if (!map.has(dateKey)) {
            map.set(dateKey, []);
        }
        map.get(dateKey)!.push(slot);
    }
    return map;
}

export function summarizeSlots(slots: Availability[]) {
    let active = 0;
    let onLeave = 0;
    const activeDays = new Set<string>();
    const leaveDays = new Set<string>();
    const coveredDays = new Set<string>();

    for (const slot of slots) {
        const dateKey = toManilaDateString(slot.available_date);
        coveredDays.add(dateKey);
        if (slot.is_on_leave) {
            onLeave += 1;
            leaveDays.add(dateKey);
        } else {
            active += 1;
            activeDays.add(dateKey);
        }
    }

    return {
        active,
        onLeave,
        activeDays: activeDays.size,
        leaveDays: leaveDays.size,
        coveredDays: coveredDays.size,
    };
}

export function buildSortedSlots(slots: Availability[], todayKey: string) {
    const slotsWithDateKeys = slots.map((slot) => ({
        slot,
        dateKey: toManilaDateString(slot.available_date),
    }));

    const ordered = slotsWithDateKeys
        .sort((a, b) => {
            const byDate = a.dateKey.localeCompare(b.dateKey);
            if (byDate !== 0) {
                return byDate;
            }
            return a.slot.available_timestart.localeCompare(b.slot.available_timestart);
        })
        .map((item) => item.slot);

    const upcomingLeaveSlots = ordered
        .filter((slot) => slot.is_on_leave && toManilaDateString(slot.available_date) >= todayKey)
        .slice(0, 4);

    return { ordered, upcomingLeaveSlots };
}
