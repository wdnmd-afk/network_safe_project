import { afterEach, describe, expect, it, vi } from "vitest";

import { submitInfoDisclosureReport } from "../src/api/info-disclosure-lab";

describe("info disclosure lab api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts report key to the selected variant", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          result: {
            status: "ok",
            variantKey: "vuln",
            reportKey: "public-status",
            inspection: {
              normalizedReportKey: "public-status",
              requestedSensitiveReport: false,
              allowedPublicReport: true,
              exposedFieldCount: 3,
              reportKeyLength: 13,
            },
            report: {
              key: "public-status",
              title: "SafeMart 公开服务状态",
              reportType: "public",
              summary: "public report",
              fields: [],
              isSensitive: false,
            },
            signal: "info-disclosure-public-report-returned",
            decision: "accepted",
            message: "public report",
            nextStep: "try debug report",
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

    const result = await submitInfoDisclosureReport(
      "vuln",
      "local-session-token",
      {
        reportKey: "public-status",
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/info-disclosure/vuln/report",
      {
        method: "POST",
        headers: {
          authorization: "Bearer local-session-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          reportKey: "public-status",
        }),
      },
    );
    expect(result.result.signal).toBe("info-disclosure-public-report-returned");
  });

  it("returns blocked response body for fixed variant debug report", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          result: {
            status: "blocked",
            variantKey: "fixed",
            reportKey: "debug-diagnostics",
            inspection: {
              normalizedReportKey: "debug-diagnostics",
              requestedSensitiveReport: true,
              allowedPublicReport: false,
              exposedFieldCount: 4,
              reportKeyLength: 17,
            },
            report: null,
            signal: "info-disclosure-debug-data-blocked",
            decision: "blocked",
            message: "blocked",
            nextStep: "compare vulnerable",
            blockedReason: "debug-report-not-public",
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

    const result = await submitInfoDisclosureReport(
      "fixed",
      "local-session-token",
      {
        reportKey: "debug-diagnostics",
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.result.signal).toBe("info-disclosure-debug-data-blocked");
  });
});
