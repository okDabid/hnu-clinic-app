import { cookies, headers } from "next/headers";

const APP_ORIGIN_ENV_VARS = [
    "EMAIL_VERIFICATION_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_URL_INTERNAL",
    "AUTH_URL",
    "AUTH_ORIGIN",
    "APP_ORIGIN",
    "APP_URL",
    "SITE_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_APP_URL",
];

function stripTrailingSlash(value: string): string {
    return value.replace(/\/$/, "");
}

function ensureProtocol(value: string): string {
    if (!/^https?:\/\//i.test(value)) {
        return `https://${value}`;
    }
    return value;
}

function normalizeBaseUrl(value: string): string {
    return stripTrailingSlash(ensureProtocol(value));
}

function resolveConfiguredBaseUrl(): string | null {
    for (const envVar of APP_ORIGIN_ENV_VARS) {
        const candidate = process.env[envVar]?.trim();
        if (candidate) {
            return normalizeBaseUrl(candidate);
        }
    }

    const vercelUrl =
        process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ??
        process.env.VERCEL_BRANCH_URL?.trim() ??
        process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ??
        process.env.VERCEL_URL?.trim();
    if (vercelUrl) {
        return normalizeBaseUrl(vercelUrl);
    }

    return null;
}

async function buildCookieHeader(): Promise<string | undefined> {
    const cookieStore = await Promise.resolve(cookies());
    const entries = cookieStore.getAll();
    if (entries.length === 0) return undefined;
    return entries.map((entry) => `${entry.name}=${entry.value}`).join("; ");
}

export async function getServerBaseUrl() {
    const configured = resolveConfiguredBaseUrl();
    if (configured) {
        return configured;
    }

    const headersList = await Promise.resolve(headers());
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
    if (host) {
        const protocol =
            headersList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
        return `${protocol}://${host}`;
    }

    console.warn(
        "Falling back to http://localhost:3000 for serverFetch requests because no base URL environment variables or host headers were available.",
    );

    return "http://localhost:3000";
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
