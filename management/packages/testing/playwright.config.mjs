import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";

import { e2eRuntime } from "./src/runtime.mjs";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: path.join(os.tmpdir(), "nsm-playwright-results"),
  globalSetup: "./src/global-setup.mjs",
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  // 用例会改动实验启停状态，必须串行执行
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: e2eRuntime.adminWebOrigin,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
});
