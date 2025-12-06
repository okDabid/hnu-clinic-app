import chromium from "@sparticuz/chromium";
import {
  chromium as playwrightChromium,
  type Browser,
  type LaunchOptions,
} from "playwright-core";

const isProd =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

export async function getChromiumLaunchOptions(
  overrides: LaunchOptions = {},
): Promise<LaunchOptions> {
  if (!isProd) {
    const { args: _ignoredArgs, ...rest } = overrides;
    return {
      headless: true,
      ...rest,
    };
  }

  const executablePath =
    (await chromium.executablePath()) ||
    process.env.PLAYWRIGHT_EXECUTABLE_PATH ||
    undefined;

  if (!executablePath) {
    throw new Error(
      "Chromium executable not found. Set PLAYWRIGHT_EXECUTABLE_PATH or ensure @sparticuz/chromium can download a binary.",
    );
  }

  const baseArgs = new Set([...(chromium.args ?? []), "--no-sandbox"]);
  const mergedArgs = [
    ...baseArgs,
    ...((overrides.args as string[] | undefined) ?? []),
  ];

  const { args: _ignored, ...restOverrides } = overrides;

  return {
    executablePath,
    args: mergedArgs,
    headless: true,
    ...restOverrides,
  };
}

export async function launchServerlessChromium(
  overrides: LaunchOptions = {},
): Promise<Browser> {
  if (!isProd) {
    const { args: _ignoredArgs, ...rest } = overrides;
    return playwrightChromium.launch({
      headless: true,
      ...rest,
    });
  }

  const options = await getChromiumLaunchOptions(overrides);
  return playwrightChromium.launch(options);
}
