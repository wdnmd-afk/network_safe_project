import assert from "node:assert/strict";
import test from "node:test";

import { verifyCoverageMatrix } from "../../../tools/coverage/verify-security-coverage.mjs";

test("security coverage matrix matches all current lab metadata", () => {
  const summary = verifyCoverageMatrix();

  assert.equal(summary.ok, true, summary.errors.join("\n"));
  assert.equal(summary.total, 67);
  assert.equal(summary.matrixRows, 67);
  // LT-006~010 把 clickjacking、open-redirect、credential-stuffing、session-hijacking、oauth 专用化；
  // LT-016 把 client.formjacking、LT-017 把 malware.ransomware 从引导式毕业为专用实验。
  // LT-021 新增 api.functional-authorization；LT-022 新增 business-logic.workflow-bypass。
  assert.equal(summary.dedicated, 36);
  assert.equal(summary.guided, 31);
  assert.deepEqual(summary.modes, {
    "case-study": 27,
    interactive: 25,
    simulation: 15,
  });
  assert.equal(summary.playwright, 10);
});
