import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { endOfManilaDay, PH_TIME_ZONE, startOfManilaDay } from "@/lib/time";
import { withDb } from "@/lib/withDb";

function parseMonth(value: string | null): { start: Date; end: Date } | null {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length !== 2) return null;

    const [yearStr, monthStr] = parts;
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
        return null;
    }

    const monthStart = new Date(`${yearStr}-${monthStr.padStart(2, "0")}-01T00:00:00+08:00`);
    if (Number.isNaN(monthStart.getTime())) return null;

    const nextMonthYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthStart = new Date(`${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+08:00`);

    return { start: monthStart, end: new Date(nextMonthStart.getTime() - 1000) };
}

function formatManilaDateOnly(date: Date): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: PH_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

async function handler(req: Request) {
    const { searchParams } = new URL(req.url);
    const clinic_id = searchParams.get("clinic_id");
    const doctor_user_id = searchParams.get("doctor_user_id");
    const month = searchParams.get("month");

    if (!clinic_id || !doctor_user_id || !month) {
        return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
    }

    const monthBounds = parseMonth(month);
    if (!monthBounds) {
        return NextResponse.json({ message: "Invalid month" }, { status: 400 });
    }

    try {
        const { start, end } = monthBounds;
        const availabilities = await withDb(() =>
            prisma.doctorAvailability.findMany({
                where: {
                    clinic_id,
                    doctor_user_id,
                    archivedAt: null,
                    available_date: {
                        gte: startOfManilaDay(formatManilaDateOnly(start)),
                        lte: endOfManilaDay(formatManilaDateOnly(end)),
                    },
                },
                orderBy: { available_date: "asc" },
            })
        );

        const availableDates = new Set<string>();
        const leaveDates = new Set<string>();

        for (const availability of availabilities) {
            const dateKey = formatManilaDateOnly(availability.available_date);
            if (availability.is_on_leave) {
                leaveDates.add(dateKey);
                continue;
            }
            availableDates.add(dateKey);
            if (leaveDates.has(dateKey)) {
                leaveDates.delete(dateKey);
            }
        }

        return NextResponse.json({
            availableDates: Array.from(availableDates),
            leaveDates: Array.from(leaveDates),
        });
    } catch (err) {
        console.error("[GET /api/meta/doctor-availability/calendar]", err);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export const GET = handler;
