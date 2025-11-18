const FLAG_ENV_KEYS = ["BOOTSTRAP_NURSE", "NEXT_PUBLIC_BOOTSTRAP_NURSE"] as const;

export function isNurseBootstrapEnabled() {
    return FLAG_ENV_KEYS.some((key) => process.env[key] === "true");
}
