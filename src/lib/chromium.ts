import { access } from "fs/promises";
import chromium from "@sparticuz/chromium";

const LOCAL_FALLBACK_PATHS: Record<NodeJS.Platform, string[]> = {
    win32: ["C:/Program Files/Google/Chrome/Application/chrome.exe"],
    darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
    linux: ["/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"],
    aix: [],
    android: [],
    freebsd: [],
    haiku: [],
    openbsd: [],
    sunos: [],
    netbsd: [],
    cygwin: [],
};

let executablePathPromise: Promise<string> | null = null;

async function findLocalExecutable() {
    const candidates = LOCAL_FALLBACK_PATHS[process.platform] ?? [];

    for (const candidate of candidates) {
        try {
            await access(candidate);
            return candidate;
        } catch {
            // Try next candidate
        }
    }

    throw new Error("Unable to resolve chromium executable path");
}

export async function resolveChromiumExecutablePath() {
    if (!executablePathPromise) {
        executablePathPromise = (async () => {
            if (process.env.CHROME_EXECUTABLE_PATH) {
                return process.env.CHROME_EXECUTABLE_PATH;
            }

            const chromiumPath = await chromium.executablePath();
            if (chromiumPath) {
                return chromiumPath;
            }

            if (process.env.AWS_REGION || process.env.VERCEL) {
                throw new Error("Unable to resolve chromium executable path");
            }

            return findLocalExecutable();
        })();
    }

    return executablePathPromise;
}

export function chromiumLaunchOptions() {
    return {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport ?? null,
        headless: chromium.headless ?? true,
        ignoreHTTPSErrors: true,
    } as const;
}
