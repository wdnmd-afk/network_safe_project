import assert from "node:assert/strict";
import test from "node:test";

import { verifyCoverageMatrix } from "../../../tools/coverage/verify-security-coverage.mjs";

test("security coverage matrix matches all current lab metadata", () => {
  const summary = verifyCoverageMatrix();

  assert.equal(summary.ok, true, summary.errors.join("\n"));
  assert.equal(summary.total, 76);
  assert.equal(summary.matrixRows, 76);
  // LT-006~010 把 clickjacking、open-redirect、credential-stuffing、session-hijacking、oauth 专用化；
  // LT-016 把 client.formjacking、LT-017 把 malware.ransomware 从引导式毕业为专用实验。
  // LT-021 新增 api.functional-authorization；LT-022 新增 business-logic.workflow-bypass；
  // LT-023 新增 crypto.insecure-randomness，LT-024 新增 detection.rule-alert-triage 专用模拟；
  // LT-025 新增 host.service-permission-audit 专用模拟并建立独立 host 分类；
  // LT-026 在 infrastructure 分类内新增 iam-policy-audit 专用模拟；
  // LT-027 把 client.mitb 从引导式目录毕业为专用 D3 模拟；
  // LT-031 为 7 个既有专用实验补 E6，LT-036~039 的 4 个新增实验也通过页面回归。
  // LT-042 在 infrastructure 分类内新增 kubernetes-rbac-audit 专用 case-study。
  assert.equal(summary.dedicated, 46);
  assert.equal(summary.guided, 30);
  assert.deepEqual(summary.modes, {
    "case-study": 29,
    interactive: 26,
    simulation: 21,
  });
  assert.equal(Object.keys(summary.categories).length, 14);
  assert.equal(summary.categories.detection, 1);
  assert.equal(summary.categories.host, 1);
  assert.equal(summary.categories.infrastructure, 7);
  assert.equal(summary.playwright, 28);
});
