import assert from "node:assert/strict";
import test from "node:test";

import {
  browserChannel,
  chromiumProjectName,
  playwrightSeedScripts,
  playwrightGlobalSetup,
  playwrightBaseUrl,
} from "../src/playwright/config.mjs";

test("playwright e2e config targets local web port", () => {
  assert.equal(playwrightBaseUrl, "http://127.0.0.1:6670");
});

test("playwright chromium config uses the system Chrome channel", () => {
  assert.equal(chromiumProjectName, "chromium");
  assert.equal(browserChannel, "chrome");
});

test("playwright uses shared global setup for local services", () => {
  assert.equal(playwrightGlobalSetup, "./src/playwright/global-setup.mjs");
});

test("playwright seeds auth users and lab metadata before browser tests", () => {
  assert.deepEqual(playwrightSeedScripts, ["seed:auth", "seed:labs"]);
});
