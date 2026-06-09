import assert from "node:assert/strict";
import test from "node:test";

import {
  browserChannel,
  chromiumProjectName,
  playwrightGlobalSetup,
  playwrightBaseUrl,
  unsafePortBypassArg,
} from "../src/playwright/config.mjs";

test("playwright e2e config targets local web port", () => {
  assert.equal(playwrightBaseUrl, "http://127.0.0.1:6666");
});

test("playwright chromium config allows the fixed frontend port", () => {
  assert.equal(chromiumProjectName, "chromium");
  assert.equal(browserChannel, "chrome");
  assert.equal(unsafePortBypassArg, "--explicitly-allowed-ports=6666");
});

test("playwright uses shared global setup for local services", () => {
  assert.equal(playwrightGlobalSetup, "./src/playwright/global-setup.mjs");
});
