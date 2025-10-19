// src/lib/time.ts

const PH_TIME_ZONE = "Asia/Manila";
const PH_UTC_OFFSET = "+08:00";

// Regex patterns for detecting ISO/TZ/time/date shapes
const ISO_TZ_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i;
const TIME_ONLY_PATTERN = /^\d{2}:\d{2}$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_NO_TZ_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;

function normalizeToPhilippineISO(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;

    if (TIME_ONLY_PATTERN.test(trimmed)) {
        return `1970-01-01T${trimmed}:00${PH_UTC_OFFSET}`;
    }

    const normalized = trimmed.replace(" ", "T");

    if (DATE_ONLY_PATTERN.test(normalized)) {
        return `${normalized}T00:00:00${PH_UTC_OFFSET}`;
    }

    if (DATETIME_NO_TZ_PATTERN.test(normalized) && !ISO_TZ_PATTERN.test(normalized)) {
        return `${normalized}${PH_UTC_OFFSET}`;
    }

    return normalized;
}

type TimeInput = string | Date | null | undefined;

function parsePhilippineDate(value: TimeInput): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    }

    if (typeof value === "string") {
        const normalized = normalizeToPhilippineISO(value);
        if (!normalized) return null;

        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
}

/**
 * ✅ Safely build a Manila-local Date (used for DB writes)
 */
export function buildManilaDate(date: string, time: string): Date {
    const normalized = `${date}T${time}:00${PH_UTC_OFFSET}`;
    return new Date(normalized);
}

export function startOfManilaDay(date: string): Date {
    return new Date(`${date}T00:00:00${PH_UTC_OFFSET}`);
}

export function endOfManilaDay(date: string): Date {
    return new Date(`${date}T23:59:59${PH_UTC_OFFSET}`);
}

/**
 * ✅ Range overlap check (appointments)
 */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && bStart < aEnd;
}

/**
 * ✅ Convert Date → 12-hour format (e.g. "2:30 PM")
 */
export function format12Hour(date: Date | string): string {
    const parsed = parsePhilippineDate(date);
    if (!parsed) return "";

    return parsed.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: PH_TIME_ZONE,
    });
}

/**
 * ✅ Convert "HH:mm" → 12-hour format for dropdowns
 */
export function formatTimeString12(time: string): string {
    const parsed = parsePhilippineDate(time);
    return parsed ? format12Hour(parsed) : "";
}

/**
 * ✅ Format full time range ("2:00 PM – 3:30 PM")
 */
export function formatTimeRange(start: TimeInput, end: TimeInput): string {
    const startDate = parsePhilippineDate(start);
    const endDate = parsePhilippineDate(end);

    const opts: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: PH_TIME_ZONE,
    };

    const startText = startDate ? startDate.toLocaleTimeString("en-PH", opts) : "";
    const endText = endDate ? endDate.toLocaleTimeString("en-PH", opts) : "";

    if (startText && endText) return `${startText} – ${endText}`;
    return startText || endText || "";
}

/**
 * ✅ Format a Date → "YYYY-MM-DD" in Manila time
 */
export function formatManilaISODate(date: Date): string {
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: PH_TIME_ZONE });
    return formatter.format(date);
}

/**
 * ✅ Convert Date string → HH:mm (24-hour) in Manila time
 */
export function toManilaTimeString(dateStr: string): string {
    const date = parsePhilippineDate(dateStr);
    if (!date) return "";

    return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: PH_TIME_ZONE,
    });
}

/**
 * ✅ Convert UTC timestamp → "YYYY-MM-DD" Manila local
 */
export function toManilaDateString(dateStr: string): string {
    const date = parsePhilippineDate(dateStr);
    if (!date) return "";

    return date.toLocaleDateString("en-CA", { timeZone: PH_TIME_ZONE });
}

/**
 * ✅ Return a Date pinned to Manila local time (independent of host)
 */
export function manilaNow(): Date {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: PH_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const parts = Object.fromEntries(
        formatter.formatToParts(now).map((p) => [p.type, p.value])
    );

    const { year, month, day, hour, minute, second } = parts;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${PH_UTC_OFFSET}`);
}

/**
 * ✅ Format Manila-localized date/time string (for display)
 */
export function formatManilaDateTime(
    value: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = {}
): string {
    const date = parsePhilippineDate(value);
    if (!date) return "";

    const baseOptions: Intl.DateTimeFormatOptions = {
        timeZone: PH_TIME_ZONE,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    };

    const merged = { ...baseOptions, ...options };
    return date.toLocaleString("en-PH", merged);
}
