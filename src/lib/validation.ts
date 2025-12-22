export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_NUMBER_REGEX = /^09\d{9}$/;
export const NAME_SUFFIX_OPTIONS = ["", "Jr.", "Sr.", "II", "III", "IV"] as const;

export function isAllowedNameSuffix(value?: string | null): boolean {
    if (value === undefined || value === null || value === "") return true;
    return NAME_SUFFIX_OPTIONS.includes(value as (typeof NAME_SUFFIX_OPTIONS)[number]);
}

/**
 * Normalizes user-entered phone numbers to the 11-digit 09XXXXXXXXX format.
 */
export function sanitizePhoneNumber(value: string): string {
    if (!value) return "";

    if (/[^0-9]/.test(value)) {
        return "INVALID";
    }

    if (/^9\d{9}$/.test(value)) {
        value = `0${value}`;
    }

    if (value.length > 11) {
        value = value.slice(0, 11);
    }

    return value;
}

type ContactValidationInput = {
    email?: string | null;
    contactNumber?: string | null;
    emergencyNumber?: string | null;
};

type ContactValidationSuccess = {
    success: true;
    email: string;
    contactNumber: string;
    emergencyNumber: string;
};

type ContactValidationError = {
    success: false;
    error: string;
};

export type ContactValidationResult = ContactValidationSuccess | ContactValidationError;

/**
 * Converts any Philippine phone input (with or without +63) into the 09XXXXXXXXX local format.
 */
export function normalizePhilippinePhoneInput(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";

    let subscriber = digits;

    if (subscriber.startsWith("63")) {
        subscriber = subscriber.slice(2);
    }

    if (subscriber.startsWith("0")) {
        subscriber = subscriber.slice(1);
    }

    subscriber = subscriber.slice(0, 10);

    return subscriber ? `0${subscriber}` : "";
}

/**
 * Formats stored 09XXXXXXXXX numbers for the phone input display without extra spacing or dial code.
 */
export function formatPhoneInputDisplay(value?: string | null): string {
    const digits = (value ?? "").replace(/\D/g, "");

    if (!digits) return "";

    let subscriber = digits;

    if (subscriber.startsWith("63")) {
        subscriber = subscriber.slice(2);
    }

    if (!subscriber.startsWith("0")) {
        subscriber = `0${subscriber}`;
    }

    return subscriber.slice(0, 11);
}

/**
 * Validates and normalizes email and contact numbers for profile forms.
 */
export function validateAndNormalizeContacts(input: ContactValidationInput): ContactValidationResult {
    const email = (input.email ?? "").trim();

    if (email && !EMAIL_REGEX.test(email)) {
        return { success: false, error: "Please enter a valid email address." };
    }

    const contactNumber = input.contactNumber ? sanitizePhoneNumber(input.contactNumber) : "";
    if (contactNumber === "INVALID" || (contactNumber && !PHONE_NUMBER_REGEX.test(contactNumber))) {
        return {
            success: false,
            error: "Contact number must contain only digits and follow the 09XXXXXXXXX format.",
        };
    }

    const emergencyNumber = input.emergencyNumber ? sanitizePhoneNumber(input.emergencyNumber) : "";
    if (emergencyNumber === "INVALID" || (emergencyNumber && !PHONE_NUMBER_REGEX.test(emergencyNumber))) {
        return {
            success: false,
            error: "Emergency contact number must contain only digits and follow the 09XXXXXXXXX format.",
        };
    }

    return {
        success: true,
        email,
        contactNumber,
        emergencyNumber,
    };
}
