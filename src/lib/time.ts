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
export function formatTimeRange(start: string, end: string): string {
    return `${formatTimeString12(start)} – ${formatTimeString12(end)}`;
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
