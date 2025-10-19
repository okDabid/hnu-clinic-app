export type ResetContactType = "EMAIL" | "PHONE";

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

    if (EMAIL_REGEX.test(raw)) {
        const normalized = raw.toLowerCase();
        return {
            normalized,
            type: "EMAIL",
            variants: [normalized],
        };
    }

    const digits = raw.replace(/[^\d]/g, "");
    let base: string | null = null;

    if (digits.length === 11 && digits.startsWith("09")) {
        base = digits;
    } else if (digits.length === 12 && digits.startsWith("639")) {
        base = `0${digits.slice(2)}`;
    } else if (digits.length === 10 && digits.startsWith("9")) {
        base = `0${digits}`;
    }

    if (!base) {
        return null;
    }

    const variants = new Set<string>();
    variants.add(base);
    variants.add(`+63${base.slice(1)}`);
    variants.add(`63${base.slice(1)}`);

    return {
        normalized: base,
        type: "PHONE",
        variants: Array.from(variants),
    };
}

export function formatPhoneForSms(base: string): string {
    // base should be in 09XXXXXXXXX format
    return `+63${base.slice(1)}`;
}
