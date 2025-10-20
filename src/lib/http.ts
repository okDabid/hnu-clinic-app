export class HttpError extends Error {
    readonly response: Response;
    readonly status: number;
    readonly body: unknown;

    constructor(response: Response, body: unknown) {
        const message =
            (typeof body === "object" && body && "message" in body && typeof body.message === "string"
                ? body.message
                : response.statusText) || "Request failed";
        super(message);
        this.name = "HttpError";
        this.response = response;
        this.status = response.status;
        this.body = body;
    }
}

export interface FetchRetryOptions {
    retries?: number;
    retryDelayMs?: number;
    retryOn?: number[];
    backoffFactor?: number;
}

const RETRYABLE_STATUS = [408, 425, 429, 500, 502, 503, 504];

async function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A resilient wrapper around `fetch` that retries transient failures using
 * exponential backoff. It also respects abort signals and throws an
 * {@link HttpError} when the server responds with a non-2xx status.
 */
export async function fetchWithRetry(
    input: RequestInfo | URL,
    init: RequestInit & { signal?: AbortSignal } = {},
    options: FetchRetryOptions = {}
): Promise<Response> {
    const { retries = 2, retryDelayMs = 400, retryOn = RETRYABLE_STATUS, backoffFactor = 2 } = options;

    const externalSignal = init.signal;
    const controller = new AbortController();

    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            const abortListener = () => controller.abort();
            externalSignal.addEventListener("abort", abortListener, { once: true });
        }
    }

    const fetchInit: RequestInit = {
        ...init,
        signal: controller.signal,
    };

    let attempt = 0;
    let lastError: unknown;
    let delayMs = retryDelayMs;

    while (attempt <= retries) {
        try {
            const response = await fetch(input, fetchInit);

            if (!response.ok) {
                const cloned = response.clone();
                let payload: unknown = null;
                try {
                    payload = await cloned.json();
                } catch {
                    try {
                        payload = await cloned.text();
                    } catch {
                        payload = null;
                    }
                }

                if (retryOn.includes(response.status) && attempt < retries) {
                    lastError = new HttpError(response, payload);
                    await delay(delayMs);
                    delayMs *= backoffFactor;
                    attempt += 1;
                    continue;
                }

                throw new HttpError(response, payload);
            }

            return response;
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                throw error;
            }

            if (error instanceof HttpError) {
                throw error;
            }

            lastError = error;
            if (attempt >= retries) {
                throw error;
            }

            await delay(delayMs);
            delayMs *= backoffFactor;
            attempt += 1;
        }
    }

    throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export async function fetchJsonWithRetry<T = unknown>(
    input: RequestInfo | URL,
    init: RequestInit & { signal?: AbortSignal } = {},
    options?: FetchRetryOptions
): Promise<T> {
    const response = await fetchWithRetry(input, init, options);
    try {
        return (await response.json()) as T;
    } catch (error) {
        throw new HttpError(response, { message: "Invalid JSON response", error });
    }
}
