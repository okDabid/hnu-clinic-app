import { cookies, headers } from "next/headers";

function buildCookieHeader(): string | undefined {
    const cookieStore = cookies();
    const entries = cookieStore.getAll();
    if (entries.length === 0) return undefined;
    return entries.map((entry) => `${entry.name}=${entry.value}`).join("; ");
}

export function getServerBaseUrl() {
    const headersList = headers();
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
    if (!host) {
        return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    }
    const protocol =
        headersList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
    return `${protocol}://${host}`;
}

export async function serverFetch<T>(path: string, init: RequestInit = {}): Promise<T | null> {
    const baseUrl = getServerBaseUrl();
    const cookieHeader = buildCookieHeader();
    const headersInit = new Headers(init.headers ?? {});
    if (cookieHeader && !headersInit.has("cookie")) {
        headersInit.set("cookie", cookieHeader);
    }

    try {
        const response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
            ...init,
            headers: headersInit,
            cache: init.cache ?? "no-store",
            credentials: "include",
        });

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as T;
        return data;
    } catch (error) {
        console.error(`Failed serverFetch for ${path}:`, error);
        return null;
    }
}
