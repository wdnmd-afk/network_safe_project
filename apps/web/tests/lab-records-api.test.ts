import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchCurrentUserLabRecords,
  recordLearningProgress,
  recordVerificationRecord,
} from "../src/api/lab-records";

describe("lab records api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("recordLearningProgress posts progress with bearer token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          progress: {
            labKey: "web.xss",
            variantKey: "vuln",
            status: "in-progress",
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

    const result = await recordLearningProgress("web", "xss", "token", {
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 XSS 漏洞版",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/xss/learning-progress",
      {
        method: "POST",
        headers: {
          authorization: "Bearer token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          variantKey: "vuln",
          status: "in-progress",
          notes: "进入 XSS 漏洞版",
        }),
      },
    );
    expect(result.progress.status).toBe("in-progress");
  });

  it("recordVerificationRecord posts manual verification with bearer token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          record: {
            labKey: "web.xss",
            variantKey: "fixed",
            result: "passed",
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

    const result = await recordVerificationRecord("web", "xss", "token", {
      variantKey: "fixed",
      result: "passed",
      summary: "修复版原样显示 HTML 字符串",
      details: {
        signal: "text-rendered",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/labs/web/xss/verification-records",
      {
        method: "POST",
        headers: {
          authorization: "Bearer token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          variantKey: "fixed",
          result: "passed",
          summary: "修复版原样显示 HTML 字符串",
          details: {
            signal: "text-rendered",
          },
        }),
      },
    );
    expect(result.record.result).toBe("passed");
  });

  it("fetchCurrentUserLabRecords reads record summary with bearer token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          records: {
            progress: [
              {
                labKey: "web.xss",
                title: "XSS",
                variantKey: "fixed",
                status: "completed",
                updatedAt: "2026-06-22T09:00:00.000Z",
              },
            ],
            verifications: [
              {
                labKey: "web.xss",
                title: "XSS",
                variantKey: "fixed",
                result: "passed",
                summary: "修复版原样显示 HTML 字符串",
                createdAt: "2026-06-22T09:01:00.000Z",
              },
            ],
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

    const result = await fetchCurrentUserLabRecords("token");

    expect(fetchMock).toHaveBeenCalledWith("/api/lab-records/me", {
      headers: {
        authorization: "Bearer token",
      },
    });
    expect(result.records.progress[0]?.labKey).toBe("web.xss");
    expect(result.records.verifications[0]?.result).toBe("passed");
  });
});
