import { fileURLToPath } from "node:url";

import { smokeChecks } from "./config.mjs";
import { runHttpCheck, waitForCheck } from "./http-checks.mjs";
import { ensureSmokeServices, stopManagedServices } from "./services.mjs";

function registerCleanup(managedServices) {
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) {
      return;
    }

    cleaned = true;
    stopManagedServices(managedServices);
  };

  process.once("exit", cleanup);
  process.once("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.once("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });
}

export async function runSmokeChecks({
  checks = smokeChecks,
  ensureServices = ensureSmokeServices,
  stopServices = stopManagedServices,
  waitForCheck: waitForReadyCheck = waitForCheck,
  runHttpCheck: runCheck = runHttpCheck,
  logger = console,
} = {}) {
  const managedServices = [];

  try {
    managedServices.push(...(await ensureServices(checks)));

    for (const check of checks) {
      await waitForReadyCheck(check);
    }

    const results = [];

    for (const check of checks) {
      results.push(await runCheck(check));
    }

    for (const result of results) {
      logger.log(`PASS ${result.name} ${result.status}`);
    }

    return results;
  } finally {
    stopServices(managedServices);
  }
}

async function main() {
  const managedServices = [];
  registerCleanup(managedServices);
  await runSmokeChecks({
    ensureServices: async (checks) => {
      managedServices.push(...(await ensureSmokeServices(checks)));
      return managedServices;
    },
    stopServices: stopManagedServices,
  });
}

const isCliEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);

if (isCliEntrypoint) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
