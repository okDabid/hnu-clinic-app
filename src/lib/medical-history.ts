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

function normalizeOptionValue(option: unknown): MedicalHistoryOption | null {
    if (typeof option !== "string") return null;

    const cleaned = option.trim();
    if (!cleaned) return null;

    const match = MEDICAL_HISTORY_OPTIONS.find(
        (candidate) => candidate.toLowerCase() === cleaned.toLowerCase()
    );
    return match ?? null;
}

function collectOptions(value: unknown): MedicalHistoryOption[] {
    if (!value) return [];

    const results: MedicalHistoryOption[] = [];

    const addIfPresent = (candidate: unknown) => {
        const match = normalizeOptionValue(candidate);
        if (match && !results.includes(match)) {
            results.push(match);
        }
    };

    if (Array.isArray(value)) {
        value.forEach(addIfPresent);
        return results;
    }

    if (typeof value === "object") {
        for (const [key, candidate] of Object.entries(value)) {
            if (candidate) {
                addIfPresent(key);
            }
        }
    }

    return results;
}

export function parseMedicalHistory(raw?: unknown): MedicalHistoryValue {
    if (!raw) {
        return { conditions: [], other: "" };
    }

    const parseStructured = (value: unknown) => {
        const conditions = Array.isArray(value)
            ? collectOptions(value)
            : collectOptions((value as { conditions?: unknown })?.conditions ?? value);

        const other =
            !Array.isArray(value) && typeof (value as { other?: unknown })?.other === "string"
                ? sanitizeFreeText((value as { other?: string }).other)
                : "";

        if (conditions.length > 0 || other.length > 0) {
            return { conditions, other };
        }
        return null;
    };

    if (typeof raw === "object") {
        const structured = parseStructured(raw);
        if (structured) return structured;
    }

    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            const structured = parseStructured(parsed);
            if (structured) return structured;
        } catch {
            // continue to legacy parsing
        }

        const segments = raw
            .split(/[,;\n]/)
            .map((segment) => segment.trim())
            .filter(Boolean);

        const conditions: MedicalHistoryOption[] = [];
        const otherValues: string[] = [];

        for (const segment of segments) {
            const match = normalizeOptionValue(segment);
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

    return { conditions: [], other: "" };
}

export function serializeMedicalHistory(value: MedicalHistoryValue | null | undefined): string | null {
    if (!value) {
        return null;
    }

    const conditions = normalizeOptions(value.conditions);
    const other = value.other ? sanitizeFreeText(value.other) : "";

    if (conditions.length === 0 && other.length === 0) {
        return null;
    }

    return JSON.stringify({
        conditions,
        other,
    });
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
