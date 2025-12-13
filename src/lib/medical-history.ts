export const MEDICAL_HISTORY_OPTIONS = [
    "Asthma",
    "Hypertension",
    "Cancer",
    "Epilepsy",
    "Diabetes",
    "Heart Disease",
    "Kidney Disease",
    "Nervous/Mental Disorder",
] as const;

export type MedicalHistoryOption = (typeof MEDICAL_HISTORY_OPTIONS)[number];

export type MedicalHistoryValue = {
    conditions: MedicalHistoryOption[];
    other?: string;
};

function sanitizeFreeText(value: string): string {
    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/[\u0000-\u001F\u007F]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeOptions(options: unknown): MedicalHistoryOption[] {
    if (!Array.isArray(options)) {
        return [];
    }

    const normalized: MedicalHistoryOption[] = [];
    for (const option of options) {
        if (typeof option !== "string") continue;
        const match = MEDICAL_HISTORY_OPTIONS.find(
            (candidate) => candidate.toLowerCase() === option.toLowerCase()
        );
        if (match && !normalized.includes(match)) {
            normalized.push(match);
        }
    }
    return normalized;
}

export function parseMedicalHistory(raw?: string | null): MedicalHistoryValue {
    if (!raw) {
        return { conditions: [], other: "" };
    }

    try {
        const parsed = JSON.parse(raw) as {
            conditions?: unknown;
            other?: unknown;
        };
        const conditions = normalizeOptions(parsed.conditions);
        const other =
            typeof parsed.other === "string" ? sanitizeFreeText(parsed.other) : "";
        return {
            conditions,
            other,
        };
    } catch {
        // fall through to legacy parsing
    }

    const segments = raw
        .split(/[,;\n]/)
        .map((segment) => segment.trim())
        .filter(Boolean);

    const conditions: MedicalHistoryOption[] = [];
    const otherValues: string[] = [];

    for (const segment of segments) {
        const match = MEDICAL_HISTORY_OPTIONS.find(
            (candidate) => candidate.toLowerCase() === segment.toLowerCase()
        );
        if (match) {
            if (!conditions.includes(match)) {
                conditions.push(match);
            }
        } else {
            otherValues.push(segment);
        }
    }

    return {
        conditions,
        other: sanitizeFreeText(otherValues.join(", ")),
    };
}

export function serializeMedicalHistory(value: MedicalHistoryValue | null | undefined): string | null {
    if (!value) {
        return null;
    }

    const conditions = normalizeOptions(value.conditions);
    const other = value.other ? sanitizeFreeText(value.other) : "";

    const parts: string[] = [...conditions];

    if (other) {
        parts.push(other);
    }

    if (parts.length === 0) {
        return null;
    }

    return parts.join(", ");
}

export function formatMedicalHistory(value: MedicalHistoryValue | null | undefined): string {
    if (!value) {
        return "";
    }

    const other = value.other ? sanitizeFreeText(value.other) : "";
    const parts: string[] = [...value.conditions];
    if (other) {
        parts.push(other);
    }
    return parts.join(", ");
}

export function hasMedicalCondition(
    value: MedicalHistoryValue | null | undefined,
    option: MedicalHistoryOption
): boolean {
    if (!value) {
        return false;
    }
    return value.conditions.includes(option);
}
