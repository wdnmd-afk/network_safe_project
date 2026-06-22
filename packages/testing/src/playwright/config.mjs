import { smokeRuntime } from "../smoke/config.mjs";

export const playwrightBaseUrl = smokeRuntime.webOrigin;
export const chromiumProjectName = "chromium";
export const browserChannel = "chrome";
export const playwrightGlobalSetup = "./src/playwright/global-setup.mjs";
export const playwrightSeedScripts = ["seed:auth", "seed:labs"];
