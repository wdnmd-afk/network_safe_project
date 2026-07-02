import { describe, expect, it } from "vitest";

import type { DependencyConfusionResult } from "../src/api/dependency-confusion-lab";
import {
  createDependencyConfusionLearningProgress,
  createDependencyConfusionVerificationRecord,
  defaultDependencyConfusionFixedManifestKey,
  defaultDependencyConfusionFixedRegistryScenarioKey,
  defaultDependencyConfusionFixedResolutionPolicyKey,
  defaultDependencyConfusionManifestKey,
  defaultDependencyConfusionRegistryScenarioKey,
  defaultDependencyConfusionResolutionPolicyKey,
  dependencyConfusionManifestOptions,
  dependencyConfusionRegistryScenarioOptions,
  dependencyConfusionResolutionPolicyOptions,
  dependencyConfusionReviewChecklist,
  formatDependencyConfusionSignal,
  getDefaultDependencyConfusionManifestKey,
  getDefaultDependencyConfusionRegistryScenarioKey,
  getDefaultDependencyConfusionResolutionPolicyKey,
  getDependencyConfusionManifestObservationRows,
  getDependencyConfusionVariantConfig,
} from "../src/labs/dependency-confusion";

function createDependencyConfusionResult(
  variantKey: DependencyConfusionResult["variantKey"],
  signal: DependencyConfusionResult["signal"],
): DependencyConfusionResult {
  const blocked = signal === "dependency-confusion-lockfile-integrity-blocked";

  return {
    status: blocked ? "blocked" : "ok",
    variantKey,
    manifestKey: blocked
      ? "mixed-source-review"
      : defaultDependencyConfusionManifestKey,
    registryScenarioKey: blocked
      ? "lockfile-integrity-mismatch"
      : defaultDependencyConfusionRegistryScenarioKey,
    resolutionPolicyKey: blocked
      ? "lockfile-integrity-audit"
      : defaultDependencyConfusionResolutionPolicyKey,
    manifestSummary: {
      manifestKey: blocked
        ? "mixed-source-review"
        : defaultDependencyConfusionManifestKey,
      title: blocked
        ? "公开依赖与私有依赖混合审计摘要"
        : "未使用 scope 的内部依赖摘要",
      dependencyShape: blocked ? "mixed-public-private" : "private-unscoped",
      privateScopeBound: blocked,
      lockfilePresent: blocked,
      publicDependencyPresent: blocked,
      learningNotes: "观察固定依赖解析差异。",
    },
    resolution: {
      resolvedSource: blocked ? "blocked-audit" : "public-registry",
      sourceTrust: blocked ? "blocked" : "untrusted",
      packageScopeStatus: blocked ? "mixed-audited" : "missing",
      lockfileStatus: blocked ? "mismatch" : "missing",
      matchedControlledSample: true,
      riskIndicatorCount: blocked ? 1 : 4,
      riskIndicators: blocked
        ? ["integrity-mismatch"]
        : [
            "private-scope-missing",
            "lockfile-missing",
            "public-name-collision",
            "source-not-audited",
          ],
      auditActions: blocked
        ? [
            "scope-registry-bound",
            "source-audited",
            "lockfile-integrity-checked",
            "resolution-blocked",
          ]
        : ["audit-missing"],
      recommendedAction: blocked
        ? "停止当前解析并复核固定来源、scope 和完整性摘要。"
        : "切换到修复版，补齐 scope 绑定、来源审计和 lockfile 校验。",
    },
    signal,
    decision: blocked ? "blocked" : "accepted",
    message: "dependency confusion observation",
    nextStep: "compare variants",
    ...(blocked ? { blockedReason: "lockfile-integrity-mismatch" } : {}),
  };
}

describe("依赖混淆前端实验模型", () => {
  it("为解析风险观察版和来源审计复盘版提供不同教学信号", () => {
    expect(getDependencyConfusionVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      perspective: "攻击方观察",
      badge: "未绑定 scope、公共同名碰撞和来源审计缺失",
    });
    expect(getDependencyConfusionVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      perspective: "防御方复盘",
      badge: "私有 scope、可信来源、lockfile 和完整性审计",
    });
  });

  it("暴露固定 manifest、固定 registry 场景和固定解析策略", () => {
    expect(defaultDependencyConfusionManifestKey).toBe(
      "unscoped-internal-name",
    );
    expect(defaultDependencyConfusionRegistryScenarioKey).toBe(
      "public-name-collision",
    );
    expect(defaultDependencyConfusionResolutionPolicyKey).toBe(
      "prefer-public-latest",
    );
    expect(defaultDependencyConfusionFixedManifestKey).toBe(
      "scoped-private-package",
    );
    expect(defaultDependencyConfusionFixedRegistryScenarioKey).toBe(
      "private-scope-pinned",
    );
    expect(defaultDependencyConfusionFixedResolutionPolicyKey).toBe(
      "scope-pinned-private",
    );
    expect(getDefaultDependencyConfusionManifestKey("vuln")).toBe(
      "unscoped-internal-name",
    );
    expect(getDefaultDependencyConfusionManifestKey("fixed")).toBe(
      "scoped-private-package",
    );
    expect(getDefaultDependencyConfusionRegistryScenarioKey("vuln")).toBe(
      "public-name-collision",
    );
    expect(getDefaultDependencyConfusionRegistryScenarioKey("fixed")).toBe(
      "private-scope-pinned",
    );
    expect(getDefaultDependencyConfusionResolutionPolicyKey("vuln")).toBe(
      "prefer-public-latest",
    );
    expect(getDefaultDependencyConfusionResolutionPolicyKey("fixed")).toBe(
      "scope-pinned-private",
    );
    expect(dependencyConfusionManifestOptions.map((item) => item.key)).toEqual([
      "unscoped-internal-name",
      "scoped-private-package",
      "mixed-source-review",
    ]);
    expect(
      dependencyConfusionRegistryScenarioOptions.map((item) => item.key),
    ).toEqual([
      "public-name-collision",
      "private-scope-pinned",
      "lockfile-integrity-mismatch",
    ]);
    expect(
      dependencyConfusionResolutionPolicyOptions.map((item) => item.key),
    ).toEqual([
      "prefer-public-latest",
      "scope-pinned-private",
      "lockfile-integrity-audit",
    ]);
  });

  it("为不同变体生成固定样例观察说明", () => {
    const vulnerableRows =
      getDependencyConfusionManifestObservationRows("vuln");
    const fixedRows = getDependencyConfusionManifestObservationRows("fixed");

    expect(vulnerableRows).toHaveLength(3);
    expect(fixedRows).toHaveLength(3);
    expect(vulnerableRows[0]).toMatchObject({
      key: "unscoped-internal-name",
      title: "未使用 scope 的内部依赖摘要",
    });
    expect(vulnerableRows[0]!.focus).toContain("公共同名");
    expect(fixedRows[1]!.focus).toContain("私有 scope 固定来源");
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createDependencyConfusionLearningProgress(
        getDependencyConfusionVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 依赖混淆解析风险观察版",
    });
  });

  it("生成解析风险观察版和来源审计复盘版验证记录载荷", () => {
    const vulnerableResult = createDependencyConfusionResult(
      "vuln",
      "dependency-confusion-public-source-selected",
    );
    const fixedResult = createDependencyConfusionResult(
      "fixed",
      "dependency-confusion-lockfile-integrity-blocked",
    );

    expect(
      createDependencyConfusionVerificationRecord(
        getDependencyConfusionVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "解析风险观察版展示了固定依赖样例中的错误来源选择风险信号。",
      details: {
        signal: "dependency-confusion-public-source-selected",
        manifestKey: "unscoped-internal-name",
        registryScenarioKey: "public-name-collision",
        resolutionPolicyKey: "prefer-public-latest",
        resolvedSource: "public-registry",
        sourceTrust: "untrusted",
        packageScopeStatus: "missing",
        lockfileStatus: "missing",
        riskIndicatorCount: 4,
        riskIndicators: [
          "private-scope-missing",
          "lockfile-missing",
          "public-name-collision",
          "source-not-audited",
        ],
        auditActions: ["audit-missing"],
        recommendedAction:
          "切换到修复版，补齐 scope 绑定、来源审计和 lockfile 校验。",
      },
    });
    expect(
      createDependencyConfusionVerificationRecord(
        getDependencyConfusionVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "来源审计复盘版展示了固定依赖样例的来源固定或完整性阻断信号。",
      details: {
        signal: "dependency-confusion-lockfile-integrity-blocked",
        manifestKey: "mixed-source-review",
        registryScenarioKey: "lockfile-integrity-mismatch",
        resolutionPolicyKey: "lockfile-integrity-audit",
        resolvedSource: "blocked-audit",
        sourceTrust: "blocked",
        packageScopeStatus: "mixed-audited",
        lockfileStatus: "mismatch",
        riskIndicatorCount: 1,
        riskIndicators: ["integrity-mismatch"],
        auditActions: [
          "scope-registry-bound",
          "source-audited",
          "lockfile-integrity-checked",
          "resolution-blocked",
        ],
        recommendedAction: "停止当前解析并复核固定来源、scope 和完整性摘要。",
      },
    });
  });

  it("静态文案保持固定样例和无真实包生态边界", () => {
    const combined = JSON.stringify({
      configs: [
        getDependencyConfusionVariantConfig("vuln"),
        getDependencyConfusionVariantConfig("fixed"),
      ],
      manifests: dependencyConfusionManifestOptions,
      scenarios: dependencyConfusionRegistryScenarioOptions,
      policies: dependencyConfusionResolutionPolicyOptions,
      checklist: dependencyConfusionReviewChecklist,
    });

    expect(
      formatDependencyConfusionSignal(
        "dependency-confusion-lockfile-integrity-blocked",
      ),
    ).toBe("修复版完整性审计已阻断");
    expect(combined).toContain("固定");
    expect(combined).toContain("不连接真实包生态");
    expect(combined).not.toContain("https://");
    expect(combined).not.toContain("npm install");
    expect(combined).not.toContain("npm publish");
    expect(combined).not.toContain("packageName");
  });
});
