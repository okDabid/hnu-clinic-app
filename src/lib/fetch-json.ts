import { fetchWithTimeout, FetchWithTimeoutOptions } from "./fetch-with-timeout";

async function extractErrorMessage(response: Response): Promise<string> {
    try {
        const data = await response.json();
        if (typeof data === "string") return data;
        if (data && typeof data === "object") {
            if (typeof (data as { message?: unknown }).message === "string") {
                return (data as { message: string }).message;
            }
            if (typeof (data as { error?: unknown }).error === "string") {
                return (data as { error: string }).error;
            }
        }
    } catch {
        // Ignore JSON parsing errors.
    }
    return response.statusText || "Request failed";
}

export async function fetchJson<T>(input: RequestInfo | URL, options: FetchWithTimeoutOptions = {}): Promise<T> {
    const response = await fetchWithTimeout(input, options);
    if (!response.ok) {
        const message = await extractErrorMessage(response);
        throw new Error(message || `Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
}
