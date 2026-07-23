import assert from "node:assert/strict";
import test from "node:test";

import { verifyCoverageMatrix } from "../../../tools/coverage/verify-security-coverage.mjs";

test("security coverage matrix matches all current lab metadata", () => {
  const summary = verifyCoverageMatrix();

  assert.equal(summary.ok, true, summary.errors.join("\n"));
  assert.equal(summary.total, 65);
  assert.equal(summary.matrixRows, 65);
  assert.equal(summary.dedicated, 27);
  assert.equal(summary.guided, 38);
  assert.deepEqual(summary.modes, {
    "case-study": 27,
    interactive: 23,
    simulation: 15,
  });
  assert.equal(summary.playwright, 10);
});
