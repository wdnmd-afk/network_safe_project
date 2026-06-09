import assert from "node:assert/strict";
import test from "node:test";

import { runSmokeChecks } from "../src/smoke/run-smoke.mjs";

test("smoke runner stops managed services after checks complete", async () => {
  const managedService = {
    label: "web",
    stopCalled: false,
    stop() {
      this.stopCalled = true;
    },
  };
  const checks = [
    {
      name: "web-home",
      url: "http://127.0.0.1:6670/",
      kind: "text",
      expectedText: "SafeMart",
    },
  ];

  await runSmokeChecks({
    checks,
    ensureServices: async () => [managedService],
    stopServices(services) {
      for (const service of services) {
        service.stop();
      }
    },
    waitForCheck: async () => undefined,
    runHttpCheck: async (check) => ({
      name: check.name,
      status: 200,
    }),
    logger: {
      log() {},
    },
  });

  assert.equal(managedService.stopCalled, true);
});
