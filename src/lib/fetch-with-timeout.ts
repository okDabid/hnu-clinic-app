export interface FetchWithTimeoutOptions extends RequestInit {
    timeout?: number;
}

export async function fetchWithTimeout(
    input: RequestInfo | URL,
    options: FetchWithTimeoutOptions = {}
): Promise<Response> {
    const { timeout = 15000, signal, ...init } = options;
    const controller = !signal ? new AbortController() : null;
    const signals: AbortSignal | undefined = signal ?? controller?.signal;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (controller && timeout > 0) {
        timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);
    }

    try {
        const response = await fetch(input, { ...init, signal: signals });
        return response;
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Request timed out");
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Network request failed");
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}
