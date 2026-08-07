import assert from "node:assert/strict";
import test from "node:test";

import { verifyCoverageMatrix } from "../../../tools/coverage/verify-security-coverage.mjs";

test("security coverage matrix matches all current lab metadata", () => {
  const summary = verifyCoverageMatrix();

  assert.equal(summary.ok, true, summary.errors.join("\n"));
  assert.equal(summary.total, 68);
  assert.equal(summary.matrixRows, 68);
  // LT-006~010 把 clickjacking、open-redirect、credential-stuffing、session-hijacking、oauth 专用化；
  // LT-016 把 client.formjacking、LT-017 把 malware.ransomware 从引导式毕业为专用实验。
  // LT-021 新增 api.functional-authorization；LT-022 新增 business-logic.workflow-bypass；
  // LT-023 新增 crypto.insecure-randomness 专用模拟。
  assert.equal(summary.dedicated, 37);
  assert.equal(summary.guided, 31);
  assert.deepEqual(summary.modes, {
    "case-study": 27,
    interactive: 25,
    simulation: 16,
  });
  assert.equal(summary.playwright, 10);
});
