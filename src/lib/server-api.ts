import { cookies, headers } from "next/headers";

async function buildCookieHeader(): Promise<string | undefined> {
    const cookieStore = await Promise.resolve(cookies());
    const entries = cookieStore.getAll();
    if (entries.length === 0) return undefined;
    return entries.map((entry) => `${entry.name}=${entry.value}`).join("; ");
}

export async function getServerBaseUrl() {
    const headersList = await Promise.resolve(headers());
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
    if (!host) {
        const configuredUrl = process.env.NEXTAUTH_URL?.trim();
        if (configuredUrl) {
            return configuredUrl.replace(/\/$/, "");
        }

        const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ?? process.env.VERCEL_URL?.trim();
        if (vercelUrl) {
            const normalized = /^https?:\/\//i.test(vercelUrl) ? vercelUrl : `https://${vercelUrl}`;
            return normalized.replace(/\/$/, "");
        }

        return "http://localhost:3000";
    }
    const protocol =
        headersList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
    return `${protocol}://${host}`;
}

export async function serverFetch<T>(path: string, init: RequestInit = {}): Promise<T | null> {
    const baseUrl = await getServerBaseUrl();
    const cookieHeader = await buildCookieHeader();
    const headersInit = new Headers(init.headers ?? {});
    if (cookieHeader && !headersInit.has("cookie")) {
        headersInit.set("cookie", cookieHeader);
    }

    const isAbsoluteUrl = /^https?:\/\//i.test(path);
    const resolvedPath = isAbsoluteUrl ? path : path.startsWith("/") ? path : `/${path}`;
    const requestUrl = isAbsoluteUrl ? resolvedPath : `${baseUrl}${resolvedPath}`;

    try {
        const response = await fetch(requestUrl, {
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
