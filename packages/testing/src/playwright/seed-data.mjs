import { spawnSync } from "node:child_process";

import { smokeRuntime } from "../smoke/config.mjs";
import { playwrightSeedScripts } from "./config.mjs";

export function ensurePlaywrightSeedData(seedScripts = playwrightSeedScripts) {
  for (const scriptName of seedScripts) {
    const result = spawnSync(
      "pnpm",
      ["--filter", "@network-safe/server", scriptName],
      {
        cwd: smokeRuntime.repoRoot,
        env: process.env,
        stdio: "inherit",
        shell: true,
        windowsHide: true,
      },
    );

    if (result.status !== 0) {
      throw new Error(`playwright seed failed: ${scriptName}`);
    }
  }
}
