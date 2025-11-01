import { toast } from "sonner";

type RateLimitPayload = {
    error?: unknown;
    message?: unknown;
};

function extractMessage(payload: RateLimitPayload, fallback?: string) {
    if (typeof payload?.error === "string" && payload.error.trim().length > 0) {
        return payload.error;
    }
    if (typeof payload?.message === "string" && payload.message.trim().length > 0) {
        return payload.message;
    }
    return fallback ?? "Too many requests. Please try again later.";
}

export function showRateLimitToast(message: string) {
    toast.error(message, { duration: 10_000 });
}

export function handleRateLimitError(
    response: Response,
    payload: RateLimitPayload | null,
    fallback?: string
): boolean {
    if (response.status !== 429) return false;
    const message = extractMessage(payload ?? {}, fallback);
    showRateLimitToast(message);
    return true;
}
