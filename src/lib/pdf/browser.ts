import chromium from "@sparticuz/chromium";
import puppeteer, { Browser, LaunchOptions } from "puppeteer-core";

let browserPromise: Promise<Browser> | null = null;

async function resolveLaunchOptions(): Promise<LaunchOptions> {
    const isLocal = !process.env.AWS_REGION && !process.env.VERCEL;

    const executablePath = isLocal
        ? process.platform === "win32"
            ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
            : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : await chromium.executablePath();

    return {
        args: isLocal ? undefined : chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath,
        headless: true,
    } satisfies LaunchOptions;
}

async function launchBrowser() {
    const options = await resolveLaunchOptions();
    const browser = await puppeteer.launch(options);

    browser.once("disconnected", () => {
        browserPromise = null;
    });

    return browser;
}

export async function getSharedBrowser() {
    if (!browserPromise) {
        browserPromise = launchBrowser().catch((error) => {
            browserPromise = null;
            throw error;
        });
    }

    return browserPromise;
}

export async function withNewPage<T>(callback: (page: Awaited<ReturnType<Browser["newPage"]>>) => Promise<T>) {
    const browser = await getSharedBrowser();
    const page = await browser.newPage();

    try {
        return await callback(page);
    } finally {
        await page.close().catch(() => { });
    }
}
