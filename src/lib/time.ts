// src/lib/time.ts

const PH_TIME_ZONE = "Asia/Manila";
// The managed database cluster runs in Asia/Singapore. Manila shares the same UTC offset
// (+08:00), so we explicitly pin every conversion to that offset to avoid relying on the
// host environment configuration.
const PH_UTC_OFFSET = "+08:00";

const ISO_TZ_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i;
const TIME_ONLY_PATTERN = /^\d{2}:\d{2}$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_NO_TZ_PATTERN =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;

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
 * ✅ Build a Manila-local Date that Prisma can store correctly in UTC.
 * We normalise the value so that the Singapore-hosted database and the
 * Manila-facing application use the same local wall clock time.
 */
export function buildManilaDate(date: string, time: string): Date {
    return new Date(`${date}T${time}:00${PH_UTC_OFFSET}`);
}

export function startOfManilaDay(date: string): Date {
    return new Date(`${date}T00:00:00${PH_UTC_OFFSET}`);
}

export function endOfManilaDay(date: string): Date {
    return new Date(`${date}T23:59:59${PH_UTC_OFFSET}`);
}

/**
 * ✅ Range overlap check (used for appointments)
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
 * ✅ Convert "HH:mm" → readable 12-hour format (used in dropdowns)
 */
export function formatTimeString12(time: string): string {
    const parsed = parsePhilippineDate(time);
    return parsed ? format12Hour(parsed) : "";
}

/**
 * ✅ Format a full time range (used in patient and doctor pages)
 */
export function formatTimeRange(start: TimeInput, end: TimeInput): string {
    const startDate = parsePhilippineDate(start);
    const endDate = parsePhilippineDate(end);

    const startText = startDate
        ? startDate.toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: PH_TIME_ZONE,
          })
        : "";

    const endText = endDate
        ? endDate.toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: PH_TIME_ZONE,
          })
        : "";

    if (startText && endText) return `${startText} – ${endText}`;
    return startText || endText || "";
}

const manilaISOFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PH_TIME_ZONE,
});

export function formatManilaISODate(date: Date): string {
    return manilaISOFormatter.format(date);
}

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
 * ✅ Convert UTC timestamp → Manila-local date string ("YYYY-MM-DD")
 * e.g. "2025-10-12T16:00:00Z" → "2025-10-13"
 */
export function toManilaDateString(dateStr: string): string {
    const date = parsePhilippineDate(dateStr);
    if (!date) return "";

    return date.toLocaleDateString("en-CA", { timeZone: PH_TIME_ZONE });
}

/**
 * ✅ Return the current Date instance pinned to Manila local time
 */
export function manilaNow(): Date {
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

    const parts = formatter.formatToParts(new Date());
    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    const year = lookup.year;
    const month = lookup.month;
    const day = lookup.day;
    const hour = lookup.hour;
    const minute = lookup.minute;
    const second = lookup.second;

    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${PH_UTC_OFFSET}`);
}

/**
 * ✅ Format a date/time value into a Manila-localized string
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

    const finalOptions = { ...baseOptions, ...options } as Intl.DateTimeFormatOptions;

    for (const key of Object.keys(finalOptions) as (keyof Intl.DateTimeFormatOptions)[]) {
        if (finalOptions[key] === undefined) {
            delete finalOptions[key];
        }
    }

    return date.toLocaleString("en-PH", finalOptions);
}