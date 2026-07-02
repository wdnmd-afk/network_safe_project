import { afterEach, describe, expect, it, vi } from "vitest";

import { submitDependencyConfusionResolution } from "../src/api/dependency-confusion-lab";
import {
  defaultDependencyConfusionManifestKey,
  defaultDependencyConfusionRegistryScenarioKey,
  defaultDependencyConfusionResolutionPolicyKey,
} from "../src/labs/dependency-confusion";

describe("dependency confusion lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts only fixed manifest, registry scenario and policy keys", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            manifestKey: defaultDependencyConfusionManifestKey,
            registryScenarioKey: defaultDependencyConfusionRegistryScenarioKey,
            resolutionPolicyKey: defaultDependencyConfusionResolutionPolicyKey,
            manifestSummary: {
              manifestKey: defaultDependencyConfusionManifestKey,
              title: "未使用 scope 的内部依赖摘要",
              dependencyShape: "private-unscoped",
              privateScopeBound: false,
              lockfilePresent: false,
              publicDependencyPresent: false,
              learningNotes: "观察内部依赖未绑定 scope 的风险。",
            },
            resolution: {
              resolvedSource: "public-registry",
              sourceTrust: "untrusted",
              packageScopeStatus: "missing",
              lockfileStatus: "missing",
              matchedControlledSample: true,
              riskIndicatorCount: 4,
              riskIndicators: [
                "private-scope-missing",
                "lockfile-missing",
                "public-name-collision",
                "source-not-audited",
              ],
              auditActions: ["audit-missing"],
              recommendedAction: "切换到修复版观察来源审计。",
            },
            signal: "dependency-confusion-public-source-selected",
            decision: "accepted",
            message: "public source selected",
            nextStep: "compare fixed",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitDependencyConfusionResolution(
      "vuln",
      "local-session-token",
      {
        manifestKey: defaultDependencyConfusionManifestKey,
        registryScenarioKey: defaultDependencyConfusionRegistryScenarioKey,
        resolutionPolicyKey: defaultDependencyConfusionResolutionPolicyKey,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/supply-chain/dependency-confusion/vuln/resolve",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          manifestKey: defaultDependencyConfusionManifestKey,
          registryScenarioKey: defaultDependencyConfusionRegistryScenarioKey,
          resolutionPolicyKey: defaultDependencyConfusionResolutionPolicyKey,
        }),
      },
    );

    const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body);

    expect(JSON.parse(requestBody)).toEqual({
      manifestKey: defaultDependencyConfusionManifestKey,
      registryScenarioKey: defaultDependencyConfusionRegistryScenarioKey,
      resolutionPolicyKey: defaultDependencyConfusionResolutionPolicyKey,
    });
    expect(requestBody).not.toContain("packageName");
    expect(requestBody).not.toContain("registryUrl");
    expect(requestBody).not.toContain("npmrc");
    expect(requestBody).not.toContain("token");
    expect(requestBody).not.toContain("lockfile");
    expect(requestBody).not.toContain("installCommand");
    expect(requestBody).not.toContain("publishCommand");
    expect(result.result.signal).toBe(
      "dependency-confusion-public-source-selected",
    );
  });

  it("returns blocked response body for controlled integrity decisions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            manifestKey: "mixed-source-review",
            registryScenarioKey: "lockfile-integrity-mismatch",
            resolutionPolicyKey: "lockfile-integrity-audit",
            manifestSummary: {
              manifestKey: "mixed-source-review",
              title: "公开依赖与私有依赖混合审计摘要",
              dependencyShape: "mixed-public-private",
              privateScopeBound: true,
              lockfilePresent: true,
              publicDependencyPresent: true,
              learningNotes: "观察完整性审计。",
            },
            resolution: {
              resolvedSource: "blocked-audit",
              sourceTrust: "blocked",
              packageScopeStatus: "mixed-audited",
              lockfileStatus: "mismatch",
              matchedControlledSample: true,
              riskIndicatorCount: 1,
              riskIndicators: ["integrity-mismatch"],
              auditActions: [
                "scope-registry-bound",
                "source-audited",
                "lockfile-integrity-checked",
                "resolution-blocked",
              ],
              recommendedAction: "停止当前解析并复核固定来源。",
            },
            signal: "dependency-confusion-lockfile-integrity-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "review logs",
            blockedReason: "lockfile-integrity-mismatch",
          },
        }),
        {
          status: 403,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await submitDependencyConfusionResolution(
      "fixed",
      "local-session-token",
      {
        manifestKey: "mixed-source-review",
        registryScenarioKey: "lockfile-integrity-mismatch",
        resolutionPolicyKey: "lockfile-integrity-audit",
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe(
      "dependency-confusion-lockfile-integrity-blocked",
    );
  });
});
