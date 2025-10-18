import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const QUARTERS = [1, 2, 3, 4] as const;
const QUARTER_LABELS = {
    1: "Q1",
    2: "Q2",
    3: "Q3",
    4: "Q4",
} as const satisfies Record<(typeof QUARTERS)[number], string>;

type PatientTypeKey = "Student" | "Employee" | "Unknown";

type PatientTypeCounts = Record<PatientTypeKey, number>;

type QuarterAccumulator = {
    consultations: number;
    patientIds: Set<string>;
    patientTypeCounts: PatientTypeCounts;
    diagnosisCounts: Map<string, number>;
};

function createAccumulator(): QuarterAccumulator {
    return {
        consultations: 0,
        patientIds: new Set(),
        patientTypeCounts: { Student: 0, Employee: 0, Unknown: 0 },
        diagnosisCounts: new Map(),
    };
}

function getQuarterRange(year: number, quarter: number) {
    const startMonth = (quarter - 1) * 3;
    const start = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, startMonth + 3, 1, 0, 0, 0, 0));

    return { start, end };
}

function getQuarterFromDate(date: Date) {
    return Math.floor(date.getUTCMonth() / 3) + 1;
}

function normalizeDiagnosis(value: string | null | undefined) {
    if (!value) return "Unspecified";

    const cleaned = value.trim();
    if (!cleaned) return "Unspecified";

    return cleaned
        .toLowerCase()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const currentDate = new Date();
    const currentYear = currentDate.getUTCFullYear();
    const currentQuarter = getQuarterFromDate(currentDate);

    const yearParam = Number.parseInt(searchParams.get("year") ?? "", 10);
    const requestedYear = Number.isNaN(yearParam) ? currentYear : yearParam;

    const quarterParam = Number.parseInt(searchParams.get("quarter") ?? "", 10);
    const requestedQuarter = QUARTERS.includes(quarterParam as (typeof QUARTERS)[number])
        ? (quarterParam as (typeof QUARTERS)[number])
        : undefined;

    const yearStart = new Date(Date.UTC(requestedYear, 0, 1, 0, 0, 0, 0));
    const yearEnd = new Date(Date.UTC(requestedYear + 1, 0, 1, 0, 0, 0, 0));

    const consultations = await prisma.consultation.findMany({
        where: {
            appointment: {
                appointment_date: {
                    gte: yearStart,
                    lt: yearEnd,
                },
            },
        },
        select: {
            diagnosis: true,
            appointment: {
                select: {
                    appointment_date: true,
                    patient_user_id: true,
                    patient: {
                        select: {
                            student: { select: { stud_user_id: true } },
                            employee: { select: { emp_id: true } },
                        },
                    },
                },
            },
        },
    });

    const quarterMap = new Map<number, QuarterAccumulator>();
    const yearPatientIds = new Set<string>();
    const yearDiagnosisCounts = new Map<string, number>();

    for (const consultation of consultations) {
        const appointment = consultation.appointment;
        if (!appointment?.appointment_date) {
            continue;
        }

        const appointmentDate = appointment.appointment_date;
        const quarter = getQuarterFromDate(appointmentDate);
        if (!QUARTERS.includes(quarter as (typeof QUARTERS)[number])) {
            continue;
        }

        const accumulator = quarterMap.get(quarter) ?? createAccumulator();

        accumulator.consultations += 1;

        if (appointment.patient_user_id) {
            accumulator.patientIds.add(appointment.patient_user_id);
            yearPatientIds.add(appointment.patient_user_id);
        }

        const patientType: PatientTypeKey = appointment.patient?.student
            ? "Student"
            : appointment.patient?.employee
            ? "Employee"
            : "Unknown";
        accumulator.patientTypeCounts[patientType] += 1;

        const diagnosis = normalizeDiagnosis(consultation.diagnosis);
        accumulator.diagnosisCounts.set(
            diagnosis,
            (accumulator.diagnosisCounts.get(diagnosis) ?? 0) + 1
        );
        yearDiagnosisCounts.set(
            diagnosis,
            (yearDiagnosisCounts.get(diagnosis) ?? 0) + 1
        );

        quarterMap.set(quarter, accumulator);
    }

    const quarters = QUARTERS.map((quarter) => {
        const { start, end } = getQuarterRange(requestedYear, quarter);
        const data = quarterMap.get(quarter) ?? createAccumulator();

        const diagnosisCounts = Array.from(data.diagnosisCounts.entries())
            .map(([diagnosis, count]) => ({ diagnosis, count }))
            .sort((a, b) => b.count - a.count);

        return {
            quarter,
            label: QUARTER_LABELS[quarter],
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            consultations: data.consultations,
            uniquePatients: data.patientIds.size,
            patientTypeCounts: data.patientTypeCounts,
            diagnosisCounts,
        };
    });

    const totals = quarters.reduce(
        (acc, quarter) => {
            acc.consultations += quarter.consultations;
            acc.uniquePatients += quarter.uniquePatients;
            return acc;
        },
        { consultations: 0, uniquePatients: 0 }
    );

    totals.uniquePatients = yearPatientIds.size;

    const yearlyTopDiagnoses = Array.from(yearDiagnosisCounts.entries())
        .map(([diagnosis, count]) => ({ diagnosis, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const fallbackQuarter = requestedQuarter
        ? requestedQuarter
        : requestedYear === currentYear
        ? currentQuarter
        : 4;

    const selectedQuarter =
        quarters.find((item) => item.quarter === fallbackQuarter) ?? quarters[0];

    return NextResponse.json({
        year: requestedYear,
        quarters,
        totals,
        selectedQuarter,
        yearlyTopDiagnoses,
    });
}
