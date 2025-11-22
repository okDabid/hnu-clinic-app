export type ResetContactType = "EMAIL" | "SMS";

export interface NormalizedContact {
    normalized: string;
    type: ResetContactType;
    variants: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE_DIGITS = /\d/g;

function normalizePhilippineMobile(input: string): NormalizedContact | null {
    const digitsOnly = input.match(PH_MOBILE_DIGITS)?.join("") ?? "";

    if (!digitsOnly) {
        return null;
    }

    // Common patterns: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (12 digits without plus)
    if (digitsOnly.length === 11 && digitsOnly.startsWith("09")) {
        const e164 = `+63${digitsOnly.slice(1)}`;
        return {
            normalized: e164,
            type: "SMS",
            variants: [e164, digitsOnly, `63${digitsOnly.slice(1)}`],
        };
    }

    if (digitsOnly.length === 12 && digitsOnly.startsWith("639")) {
        const e164 = `+${digitsOnly}`;
        const local = `0${digitsOnly.slice(2)}`;
        return {
            normalized: e164,
            type: "SMS",
            variants: [e164, digitsOnly, local],
        };
    }

    if (digitsOnly.length === 10 && digitsOnly.startsWith("9")) {
        const e164 = `+63${digitsOnly}`;
        const local = `0${digitsOnly}`;
        return {
            normalized: e164,
            type: "SMS",
            variants: [e164, digitsOnly, local],
        };
    }

    return null;
}

/**
 * Ensures the reset contact is a valid email and returns normalized variants.
 */
export function normalizeResetContact(input: string): NormalizedContact | null {
    const raw = input.trim();

    if (!raw) {
        return null;
    }

    const phone = normalizePhilippineMobile(raw);
    if (phone) {
        return phone;
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
