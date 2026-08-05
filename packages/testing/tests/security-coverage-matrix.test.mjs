import assert from "node:assert/strict";
import test from "node:test";

import { verifyCoverageMatrix } from "../../../tools/coverage/verify-security-coverage.mjs";

test("security coverage matrix matches all current lab metadata", () => {
  const summary = verifyCoverageMatrix();

  assert.equal(summary.ok, true, summary.errors.join("\n"));
  assert.equal(summary.total, 66);
  assert.equal(summary.matrixRows, 66);
  // LT-006~010 把 clickjacking、open-redirect、credential-stuffing、session-hijacking、oauth 专用化；
  // LT-016 把 client.formjacking、LT-017 把 malware.ransomware 从引导式毕业为专用实验。
  // LT-021 新增 api.functional-authorization，当前以 in-progress 纳入专用 D4 统计。
  assert.equal(summary.dedicated, 35);
  assert.equal(summary.guided, 31);
  assert.deepEqual(summary.modes, {
    "case-study": 27,
    interactive: 24,
    simulation: 15,
  });
  assert.equal(summary.playwright, 10);
});
