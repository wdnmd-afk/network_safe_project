import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchCurrentUserLabEventLogs,
  fetchCurrentUserLabRecords,
  fetchCurrentUserRecapQuestionCompletions,
  recordLearningProgress,
  recordVerificationRecord,
  setCurrentUserRecapQuestionCompletion,
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

  it("fetchCurrentUserLabEventLogs reads recent events with optional lab filter", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          events: [
            {
              traceId: "trace-xss-fixed",
              labKey: "web.xss",
              title: "XSS",
              variantKey: "fixed",
              phase: "defense",
              eventType: "success",
              actorPerspective: "user",
              decision: "accepted",
              signal: "xss-payload-rendered-as-text",
              statusCode: 200,
              message: "修复版按文本显示输入",
              riskLevel: "low",
              createdAt: "2026-06-25T08:00:00.000Z",
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await fetchCurrentUserLabEventLogs("token", {
      labKey: "web.xss",
      phase: "defense",
      riskLevel: "low",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lab-event-logs/me?labKey=web.xss&phase=defense&riskLevel=low",
      {
        headers: {
          authorization: "Bearer token",
        },
      },
    );
    expect(result.events[0]?.signal).toBe("xss-payload-rendered-as-text");
  });

  it("fetchCurrentUserRecapQuestionCompletions reads persisted completion state", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          items: [
            {
              traceId: "trace-csrf-vuln",
              labKey: "web.csrf",
              questionIndex: 0,
              questionKey: "question-0",
              completed: true,
              completedAt: "2026-06-29T08:00:00.000Z",
              updatedAt: "2026-06-29T08:01:00.000Z",
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await fetchCurrentUserRecapQuestionCompletions("token", {
      labKey: "web.csrf",
      traceIds: ["trace-csrf-vuln", "trace-extra"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lab-recap-question-completions/me?labKey=web.csrf&traceIds=trace-csrf-vuln%2Ctrace-extra",
      {
        headers: {
          authorization: "Bearer token",
        },
      },
    );
    expect(result.items[0]?.questionKey).toBe("question-0");
  });

  it("setCurrentUserRecapQuestionCompletion persists completion state", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          item: {
            traceId: "trace-csrf-vuln",
            labKey: "web.csrf",
            questionIndex: 1,
            questionKey: "question-1",
            completed: false,
            completedAt: null,
            updatedAt: "2026-06-29T08:02:00.000Z",
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

    const result = await setCurrentUserRecapQuestionCompletion("token", {
      traceId: "trace-csrf-vuln",
      labKey: "web.csrf",
      questionIndex: 1,
      completed: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lab-recap-question-completions/me",
      {
        method: "PUT",
        headers: {
          authorization: "Bearer token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          traceId: "trace-csrf-vuln",
          labKey: "web.csrf",
          questionIndex: 1,
          completed: false,
        }),
      },
    );
    expect(result.item.completed).toBe(false);
  });
});
