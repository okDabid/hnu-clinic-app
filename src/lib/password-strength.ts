export type PasswordStrength = {
    label: "" | "Too weak" | "Medium" | "Strong";
    value: number;
    indicatorClass: string;
    textClass: string;
};

export function getPasswordStrength(password: string): PasswordStrength {
    const trimmed = password.trim();
    if (!trimmed) {
        return { label: "", value: 0, indicatorClass: "bg-primary", textClass: "" };
    }

    let score = 0;
    if (trimmed.length >= 8) score += 1;
    if (trimmed.length >= 12) score += 1;
    if (/[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed)) score += 1;
    if (/\d/.test(trimmed)) score += 1;
    if (/[^A-Za-z0-9]/.test(trimmed)) score += 1;

    if (trimmed.length < 8 || score <= 2) {
        return {
            label: "Too weak",
            value: 25,
            indicatorClass: "bg-red-500",
            textClass: "text-red-600",
        };
    }

    if (score <= 4) {
        return {
            label: "Medium",
            value: 60,
            indicatorClass: "bg-amber-500",
            textClass: "text-amber-600",
        };
    }

    return {
        label: "Strong",
        value: 100,
        indicatorClass: "bg-green-500",
        textClass: "text-green-600",
    };
}
