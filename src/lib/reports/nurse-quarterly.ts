import { prisma } from "@/lib/prisma";

export const NURSE_REPORT_QUARTERS = [1, 2, 3, 4] as const;

export const NURSE_QUARTER_LABELS = {
    1: "Q1",
    2: "Q2",
    3: "Q3",
    4: "Q4",
} as const satisfies Record<(typeof NURSE_REPORT_QUARTERS)[number], string>;

export type QuarterNumber = (typeof NURSE_REPORT_QUARTERS)[number];

export type PatientTypeKey = "Student" | "Employee" | "Unknown";

export type DiagnosisCount = {
    diagnosis: string;
    count: number;
};

export type QuarterReport = {
    quarter: QuarterNumber;
    label: string;
    startDate: string;
    endDate: string;
    consultations: number;
    uniquePatients: number;
    patientTypeCounts: Record<PatientTypeKey, number>;
    diagnosisCounts: DiagnosisCount[];
};

export type ReportsResponse = {
    year: number;
    quarters: QuarterReport[];
    totals: {
        consultations: number;
        uniquePatients: number;
    };
    selectedQuarter: QuarterReport;
    yearlyTopDiagnoses: DiagnosisCount[];
};

export type GenerateReportOptions = {
    year?: number;
    quarter?: QuarterNumber;
};

type QuarterAccumulator = {
    consultations: number;
    patientIds: Set<string>;
    patientTypeCounts: Record<PatientTypeKey, number>;
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

function getQuarterRange(year: number, quarter: QuarterNumber) {
    const startMonth = (quarter - 1) * 3;
    const start = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, startMonth + 3, 1, 0, 0, 0, 0));

    return { start, end };
}

function getQuarterFromDate(date: Date): QuarterNumber {
    return (Math.floor(date.getUTCMonth() / 3) + 1) as QuarterNumber;
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

function isValidQuarter(quarter: number | undefined | null): quarter is QuarterNumber {
    return NURSE_REPORT_QUARTERS.includes(quarter as QuarterNumber);
}

export async function generateNurseQuarterlyReport(options: GenerateReportOptions = {}): Promise<ReportsResponse> {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentQuarter = getQuarterFromDate(now);

    const requestedYear = Number.isFinite(options.year) ? Number(options.year) : currentYear;
    const requestedQuarter = options.quarter && isValidQuarter(options.quarter) ? options.quarter : undefined;

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

    const quarterMap = new Map<QuarterNumber, QuarterAccumulator>();
    const yearPatientIds = new Set<string>();
    const yearDiagnosisCounts = new Map<string, number>();

    for (const consultation of consultations) {
        const appointment = consultation.appointment;
        if (!appointment?.appointment_date) {
            continue;
        }

        const appointmentDate = appointment.appointment_date;
        const quarter = getQuarterFromDate(appointmentDate);
        if (!isValidQuarter(quarter)) {
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
        accumulator.diagnosisCounts.set(diagnosis, (accumulator.diagnosisCounts.get(diagnosis) ?? 0) + 1);
        yearDiagnosisCounts.set(diagnosis, (yearDiagnosisCounts.get(diagnosis) ?? 0) + 1);

        quarterMap.set(quarter, accumulator);
    }

    const quarters: QuarterReport[] = NURSE_REPORT_QUARTERS.map((quarter) => {
        const { start, end } = getQuarterRange(requestedYear, quarter);
        const data = quarterMap.get(quarter) ?? createAccumulator();

        const diagnosisCounts = Array.from(data.diagnosisCounts.entries())
            .map(([diagnosis, count]) => ({ diagnosis, count }))
            .sort((a, b) => b.count - a.count);

        return {
            quarter,
            label: NURSE_QUARTER_LABELS[quarter],
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            consultations: data.consultations,
            uniquePatients: data.patientIds.size,
            patientTypeCounts: data.patientTypeCounts,
            diagnosisCounts,
        } satisfies QuarterReport;
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

    return {
        year: requestedYear,
        quarters,
        totals,
        selectedQuarter,
        yearlyTopDiagnoses,
    } satisfies ReportsResponse;
}
