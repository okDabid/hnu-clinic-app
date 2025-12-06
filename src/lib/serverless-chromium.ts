import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium, type LaunchOptions } from "playwright-core";

export async function getChromiumLaunchOptions(): Promise<LaunchOptions> {
  const executablePath = (await chromium.executablePath())
    || process.env.PLAYWRIGHT_EXECUTABLE_PATH
    || undefined;

  if (!executablePath) {
    throw new Error(
      "Chromium executable not found. Set PLAYWRIGHT_EXECUTABLE_PATH or ensure @sparticuz/chromium can download a binary."
    );
  }

  const args = new Set([...(chromium.args ?? []), "--no-sandbox"]);

  return {
    args: Array.from(args),
    executablePath,
    headless: true,
  } satisfies LaunchOptions;
}

export async function launchServerlessChromium(overrides: LaunchOptions = {}) {
  const baseOptions = await getChromiumLaunchOptions();
  const mergedArgs = [...(baseOptions.args ?? []), ...(overrides.args ?? [])];

  return playwrightChromium.launch({
    ...baseOptions,
    ...overrides,
    args: mergedArgs,
  });
}
