import chromium from "@sparticuz/chromium";
import {
  chromium as playwrightChromium,
  type Browser,
  type LaunchOptions,
} from "playwright-core";

const isProd =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

type ChromiumWithExtras = typeof chromium & {
  headless?: boolean;
  env?: NodeJS.ProcessEnv;
};

const chromiumWithExtras = chromium as ChromiumWithExtras;

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
    process.env.PLAYWRIGHT_EXECUTABLE_PATH ||
    (await chromium.executablePath()) ||
    undefined;

  if (!executablePath) {
    throw new Error(
      "Chromium executable not found. Set PLAYWRIGHT_EXECUTABLE_PATH or ensure @sparticuz/chromium can download a binary.",
    );
  }

  const baseArgs = [...(chromium.args ?? []), "--no-sandbox"];
  const mergedArgs = [
    ...baseArgs,
    ...((overrides.args as string[] | undefined) ?? []),
  ];

  const { args: _ignored, env: overrideEnv, ...restOverrides } = overrides;

  return {
    executablePath,
    args: mergedArgs,
    headless: chromiumWithExtras.headless ?? true,
    // Use process.env + overrides to avoid any weirdness from chromium.env
    env: { ...(process.env as NodeJS.ProcessEnv), ...(overrideEnv ?? {}) },
    ...restOverrides,
  };
}

export async function launchServerlessChromium(
  overrides: LaunchOptions = {},
): Promise<Browser> {
  try {
    if (!isProd) {
      const { args: _ignoredArgs, ...rest } = overrides;
      return await playwrightChromium.launch({
        headless: true,
        ...rest,
      });
    }

    const options = await getChromiumLaunchOptions(overrides);
    return await playwrightChromium.launch(options);
  } catch (err) {
    console.error("[PDF] Failed to launch serverless Chromium", err);
    throw err;
  }
}
