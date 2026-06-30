import { afterEach, describe, expect, it, vi } from "vitest";

import { submitSsrfFetch } from "../src/api/ssrf-lab";

describe("ssrf lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts target url to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            targetUrl: "https://safe-mart-cdn.local/public/catalog.json",
            resolvedUrl: "https://safe-mart-cdn.local/public/catalog.json",
            inspection: {
              normalizedUrl: "https://safe-mart-cdn.local/public/catalog.json",
              protocol: "https:",
              hostname: "safe-mart-cdn.local",
              pathname: "/public/catalog.json",
              allowedPublicHost: true,
              privateTarget: false,
              targetUrlLength: 48,
            },
            resource: {
              url: "https://safe-mart-cdn.local/public/catalog.json",
              title: "SafeMart 公开商品目录",
              resourceType: "public",
              content: "public resource",
              isSensitive: false,
            },
            signal: "ssrf-public-resource-fetched",
            decision: "accepted",
            message: "public fetch",
            nextStep: "try internal target",
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

    const result = await submitSsrfFetch("vuln", "local-session-token", {
      targetUrl: "https://safe-mart-cdn.local/public/catalog.json",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/labs/web/ssrf/vuln/fetch", {
      method: "POST",
      headers: {
        authorization: "Bearer local-session-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        targetUrl: "https://safe-mart-cdn.local/public/catalog.json",
      }),
    });
    expect(result.result.signal).toBe("ssrf-public-resource-fetched");
  });

  it("returns blocked response body for fixed variant internal target", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            targetUrl:
              "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo",
            resolvedUrl:
              "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo",
            inspection: {
              normalizedUrl:
                "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo",
              protocol: "http:",
              hostname: "169.254.169.254",
              pathname: "/latest/meta-data/iam/security-credentials/demo",
              allowedPublicHost: false,
              privateTarget: true,
              targetUrlLength: 71,
            },
            resource: null,
            signal: "ssrf-private-target-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "private-target",
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

    const result = await submitSsrfFetch("fixed", "local-session-token", {
      targetUrl:
        "http://169.254.169.254/latest/meta-data/iam/security-credentials/demo",
    });

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("ssrf-private-target-blocked");
  });
});
