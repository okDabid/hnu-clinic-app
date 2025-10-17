// src/lib/time.ts

/**
 * ✅ Build a Manila-local Date that Prisma can store correctly in UTC.
 * Requires `TZ=Asia/Manila` in next.config.js.
 */
export function buildManilaDate(date: string, time: string): Date {
    return new Date(`${date}T${time}:00+08:00`);
}

export function startOfManilaDay(date: string): Date {
    return new Date(`${date}T00:00:00+08:00`);
}

export function endOfManilaDay(date: string): Date {
    return new Date(`${date}T23:59:59+08:00`);
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
    const d = typeof date === "string" ? new Date(date) : date;
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * ✅ Convert "HH:mm" → readable 12-hour format (used in dropdowns)
 */
export function formatTimeString12(time: string): string {
    const [hh, mm] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hh, mm, 0);
    return format12Hour(date);
}

/**
 * ✅ Format a full time range (used in patient and doctor pages)
 */
type TimeInput = string | Date | null | undefined;

function parseTimeInput(value: TimeInput): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;

        if (/^\d{2}:\d{2}$/.test(trimmed)) {
            return new Date(`1970-01-01T${trimmed}:00+08:00`);
        }

        const date = new Date(trimmed);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
}

export function formatTimeRange(start: TimeInput, end: TimeInput): string {
    const startDate = parseTimeInput(start);
    const endDate = parseTimeInput(end);

    const startText = startDate
        ? startDate.toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Manila",
          })
        : "";

    const endText = endDate
        ? endDate.toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Manila",
          })
        : "";

    if (startText && endText) return `${startText} – ${endText}`;
    return startText || endText || "";
}

const manilaISOFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
});

export function formatManilaISODate(date: Date): string {
    return manilaISOFormatter.format(date);
}

export function toManilaTimeString(dateStr: string): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Manila",
    });
}

/**
 * ✅ Convert UTC timestamp → Manila-local date string ("YYYY-MM-DD")
 * e.g. "2025-10-12T16:00:00Z" → "2025-10-13"
 */
export function toManilaDateString(dateStr: string): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

/**
 * ✅ Return the current Date instance pinned to Manila local time
 */
export function manilaNow(): Date {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
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

    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`);
}

/**
 * ✅ Format a date/time value into a Manila-localized string
 */
export function formatManilaDateTime(
    value: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = {}
): string {
    if (!value) return "";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "";

    const baseOptions: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Manila",
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