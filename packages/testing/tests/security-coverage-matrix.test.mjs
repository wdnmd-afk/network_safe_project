import assert from "node:assert/strict";
import test from "node:test";

import { verifyCoverageMatrix } from "../../../tools/coverage/verify-security-coverage.mjs";

test("security coverage matrix matches all current lab metadata", () => {
  const summary = verifyCoverageMatrix();

  assert.equal(summary.ok, true, summary.errors.join("\n"));
  assert.equal(summary.total, 65);
  assert.equal(summary.matrixRows, 65);
  // web.clickjacking 在 LT-006 专用化后从引导式毕业为专用实验：27→28 专用、38→37 引导式。
  assert.equal(summary.dedicated, 29);
  assert.equal(summary.guided, 36);
  assert.deepEqual(summary.modes, {
    "case-study": 27,
    interactive: 23,
    simulation: 15,
  });
  assert.equal(summary.playwright, 10);
});
