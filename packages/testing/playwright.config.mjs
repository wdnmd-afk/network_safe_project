import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";

import {
  chromiumProjectName,
  browserChannel,
  playwrightGlobalSetup,
  playwrightBaseUrl,
  unsafePortBypassArg,
} from "./src/playwright/config.mjs";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: path.join(os.tmpdir(), "network-safe-playwright-results"),
  globalSetup: playwrightGlobalSetup,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: playwrightBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: chromiumProjectName,
      use: {
        ...devices["Desktop Chrome"],
        channel: browserChannel,
        launchOptions: {
          args: [unsafePortBypassArg],
        },
      },
    },
  ],
});
