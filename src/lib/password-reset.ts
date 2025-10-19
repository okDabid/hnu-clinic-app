export type ResetContactType = "EMAIL";

export interface NormalizedContact {
    normalized: string;
    type: ResetContactType;
    variants: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeResetContact(input: string): NormalizedContact | null {
    const raw = input.trim();

    if (!raw) {
        return null;
    }

    if (!EMAIL_REGEX.test(raw)) {
        return null;
    }

    const normalized = raw.toLowerCase();
    return {
        normalized,
        type: "EMAIL",
        variants: [normalized],
    };
}
