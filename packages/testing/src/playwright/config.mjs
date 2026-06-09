import { smokeRuntime } from "../smoke/config.mjs";

export const playwrightBaseUrl = smokeRuntime.webOrigin;
export const chromiumProjectName = "chromium";
export const browserChannel = "chrome";
export const unsafePortBypassArg = "--explicitly-allowed-ports=6666";
export const playwrightGlobalSetup = "./src/playwright/global-setup.mjs";
