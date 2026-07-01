import { afterEach, describe, expect, it, vi } from "vitest";

import { submitPortScanObservation } from "../src/api/port-scan-lab";
import {
  defaultPortScanProfile,
  defaultPortScanTargetKey,
} from "../src/labs/port-scan";

describe("port scan lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts only fixed virtual target and profile to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            targetKey: defaultPortScanTargetKey,
            scanProfile: defaultPortScanProfile,
            target: {
              targetKey: defaultPortScanTargetKey,
              title: "虚拟后台管理节点",
              profile: "exposed",
              description: "virtual target",
            },
            ports: [],
            summary: {
              virtualPortCount: 4,
              openPortCount: 4,
              restrictedPortCount: 0,
              highRiskPortCount: 3,
              exposureScore: 155,
              matchedControlledSample: true,
            },
            signal: "port-scan-management-surface-visible",
            decision: "accepted",
            message: "management surface visible",
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

    const result = await submitPortScanObservation(
      "vuln",
      "local-session-token",
      {
        targetKey: defaultPortScanTargetKey,
        scanProfile: defaultPortScanProfile,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/network/port-scan/vuln/scan",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          targetKey: defaultPortScanTargetKey,
          scanProfile: defaultPortScanProfile,
        }),
      },
    );
    expect(fetchMock.mock.calls[0]?.[1]?.body).not.toContain("host");
    expect(fetchMock.mock.calls[0]?.[1]?.body).not.toContain("portRange");
    expect(result.result.signal).toBe("port-scan-management-surface-visible");
  });

  it("returns blocked response body for controlled boundary failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "vuln",
            targetKey: "blocked-target",
            scanProfile: defaultPortScanProfile,
            target: null,
            ports: [],
            summary: {
              virtualPortCount: 0,
              openPortCount: 0,
              restrictedPortCount: 0,
              highRiskPortCount: 0,
              exposureScore: 0,
              matchedControlledSample: false,
            },
            signal: "port-scan-target-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "choose fixed virtual target",
            blockedReason: "target-not-allowed",
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

    const result = await submitPortScanObservation(
      "vuln",
      "local-session-token",
      {
        targetKey: defaultPortScanTargetKey,
        scanProfile: defaultPortScanProfile,
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("port-scan-target-blocked");
  });
});
