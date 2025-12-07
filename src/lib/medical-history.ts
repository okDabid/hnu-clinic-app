import { MedicalHistoryCondition } from "../../prisma/generated/enums";

export const MEDICAL_HISTORY_OPTIONS = [
    MedicalHistoryCondition.Asthma,
    MedicalHistoryCondition.Hypertension,
    MedicalHistoryCondition.Cancer,
    MedicalHistoryCondition.Epilepsy,
    MedicalHistoryCondition.Diabetes,
    MedicalHistoryCondition.HeartDisease,
    MedicalHistoryCondition.KidneyDisease,
    MedicalHistoryCondition.NervousMentalDisorder,
] as const satisfies readonly MedicalHistoryCondition[];

export type MedicalHistoryOption = MedicalHistoryCondition;

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

function parseJsonLenient(raw: string): unknown | null {
    const attempts = [raw];
    if (raw.includes("'")) {
        attempts.push(raw.replace(/'/g, '"'));
    }

    for (const candidate of attempts) {
        try {
            return JSON.parse(candidate);
        } catch {
            // continue trying remaining candidates
        }
    }

    return null;
}

export function parseMedicalHistory(
    raw?: string | MedicalHistoryOption[] | null
): MedicalHistoryValue {
    if (!raw) {
        return { conditions: [], other: "" };
    }

    if (Array.isArray(raw)) {
        return { conditions: normalizeOptions(raw), other: "" };
    }

    const parsed = parseJsonLenient(raw);

    if (parsed) {
        // Legacy payload stored as a plain JSON array, e.g. ["Asthma", "Diabetes"]
        if (Array.isArray(parsed)) {
            return {
                conditions: normalizeOptions(parsed),
                other: "",
            };
        }

        if (typeof parsed === "object") {
            const { conditions, other } = (parsed ?? {}) as {
                conditions?: unknown;
                other?: unknown;
            };

            return {
                conditions: normalizeOptions(conditions),
                other: typeof other === "string" ? sanitizeFreeText(other) : "",
            };
        }
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

export function serializeMedicalHistory(
    value: MedicalHistoryValue | null | undefined
): MedicalHistoryOption[] | null {
    if (!value) {
        return null;
    }

    const conditions = normalizeOptions(value.conditions);
    const other = value.other ? sanitizeFreeText(value.other) : "";

    if (conditions.length === 0 && other.length === 0) {
        return null;
    }

    return conditions;
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
