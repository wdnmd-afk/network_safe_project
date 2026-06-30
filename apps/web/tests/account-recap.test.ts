import { describe, expect, it } from "vitest";

import {
  createLabEventLogLabOptions,
  createLabRecapCompletionSummaries,
} from "../src/labs/account-recap";
import type {
  CurrentUserLabEventLogsResponse,
  CurrentUserLabRecordsResponse,
} from "../src/api/lab-records";

describe("账户中心事件复盘筛选模型", () => {
  it("从学习记录、验证记录和事件日志合并实验筛选选项", () => {
    const records: CurrentUserLabRecordsResponse["records"] = {
      progress: [
        {
          labKey: "web.xss",
          title: "XSS",
          variantKey: "fixed",
          status: "completed",
          updatedAt: "2026-06-25T08:00:00.000Z",
        },
      ],
      verifications: [
        {
          labKey: "auth.jwt",
          title: "JWT 攻击",
          variantKey: "vuln",
          result: "passed",
          summary: "漏洞版接受了无签名 admin token",
          createdAt: "2026-06-25T08:01:00.000Z",
        },
      ],
    };
    const events: CurrentUserLabEventLogsResponse["events"] = [
      {
        traceId: "trace-brute-force-fixed",
        labKey: "auth.brute-force",
        title: "暴力破解",
        variantKey: "fixed",
        phase: "defense",
        eventType: "blocked",
        actorPerspective: "attacker",
        decision: "blocked",
        signal: "brute-force-rate-limit-blocked",
        statusCode: 429,
        message: "修复版触发节流",
        riskLevel: "medium",
        createdAt: "2026-06-25T08:02:00.000Z",
      },
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
        createdAt: "2026-06-25T08:03:00.000Z",
      },
    ];

    expect(
      createLabEventLogLabOptions({
        records,
        events,
      }),
    ).toEqual([
      {
        labKey: "auth.brute-force",
        title: "暴力破解",
      },
      {
        labKey: "auth.jwt",
        title: "JWT 攻击",
      },
      {
        labKey: "web.xss",
        title: "XSS",
      },
    ]);
  });

  it("保留当前已选择但暂时没有结果的实验 key", () => {
    expect(
      createLabEventLogLabOptions({
        records: {
          progress: [],
          verifications: [],
        },
        events: [],
        selectedLabKey: "auth.brute-force",
      }),
    ).toEqual([
      {
        labKey: "auth.brute-force",
        title: "auth.brute-force",
      },
    ]);
  });
});

describe("account recap completion stats", () => {
  const events: CurrentUserLabEventLogsResponse["events"] = [
    {
      traceId: "trace-csrf-vuln",
      labKey: "web.csrf",
      title: "CSRF transfer",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      decision: "accepted",
      signal: "csrf-transfer-accepted",
      statusCode: 200,
      message: "vulnerable variant accepted a request without token",
      riskLevel: "high",
      createdAt: "2026-06-29T08:00:00.000Z",
    },
    {
      traceId: "trace-csrf-fixed",
      labKey: "web.csrf",
      title: "CSRF transfer",
      variantKey: "fixed",
      phase: "defense",
      eventType: "blocked",
      actorPerspective: "attacker",
      decision: "blocked",
      signal: "csrf-token-required",
      statusCode: 403,
      message: "fixed variant blocked request without token",
      riskLevel: "medium",
      createdAt: "2026-06-29T08:01:00.000Z",
    },
    {
      traceId: "trace-jwt-vuln",
      labKey: "auth.jwt",
      title: "JWT attack",
      variantKey: "vuln",
      phase: "attack",
      eventType: "success",
      actorPerspective: "attacker",
      decision: "accepted",
      signal: "jwt-none-admin-accepted",
      statusCode: 200,
      message: "vulnerable variant accepted unsigned admin token",
      riskLevel: "high",
      createdAt: "2026-06-29T08:02:00.000Z",
    },
  ];

  it("groups completion stats by lab", () => {
    expect(
      createLabRecapCompletionSummaries({
        events,
        completions: [
          {
            traceId: "trace-csrf-vuln",
            labKey: "web.csrf",
            questionIndex: 0,
            questionKey: "question-0",
            completed: true,
            completedAt: "2026-06-29T08:03:00.000Z",
            updatedAt: "2026-06-29T08:03:00.000Z",
          },
          {
            traceId: "trace-csrf-fixed",
            labKey: "web.csrf",
            questionIndex: 1,
            questionKey: "question-1",
            completed: true,
            completedAt: "2026-06-29T08:04:00.000Z",
            updatedAt: "2026-06-29T08:04:00.000Z",
          },
          {
            traceId: "trace-csrf-fixed",
            labKey: "web.csrf",
            questionIndex: 2,
            questionKey: "question-2",
            completed: false,
            completedAt: null,
            updatedAt: "2026-06-29T08:05:00.000Z",
          },
          {
            traceId: "trace-jwt-vuln",
            labKey: "auth.jwt",
            questionIndex: 0,
            questionKey: "question-0",
            completed: true,
            completedAt: "2026-06-29T08:06:00.000Z",
            updatedAt: "2026-06-29T08:06:00.000Z",
          },
        ],
      }),
    ).toEqual([
      {
        labKey: "auth.jwt",
        title: "JWT attack",
        eventCount: 1,
        completedQuestions: 1,
        totalQuestions: 4,
        completionPercent: 25,
      },
      {
        labKey: "web.csrf",
        title: "CSRF transfer",
        eventCount: 2,
        completedQuestions: 2,
        totalQuestions: 8,
        completionPercent: 25,
      },
    ]);
  });

  it("ignores completion records outside the current question range", () => {
    expect(
      createLabRecapCompletionSummaries({
        events: [events[0]!],
        completions: [
          {
            traceId: "trace-csrf-vuln",
            labKey: "web.csrf",
            questionIndex: 99,
            questionKey: "question-99",
            completed: true,
            completedAt: "2026-06-29T08:07:00.000Z",
            updatedAt: "2026-06-29T08:07:00.000Z",
          },
        ],
      }),
    ).toEqual([
      {
        labKey: "web.csrf",
        title: "CSRF transfer",
        eventCount: 1,
        completedQuestions: 0,
        totalQuestions: 4,
        completionPercent: 0,
      },
    ]);
  });

  it("returns no summaries for an empty event list", () => {
    expect(
      createLabRecapCompletionSummaries({
        events: [],
        completions: [
          {
            traceId: "trace-csrf-vuln",
            labKey: "web.csrf",
            questionIndex: 0,
            questionKey: "question-0",
            completed: true,
            completedAt: "2026-06-29T08:08:00.000Z",
            updatedAt: "2026-06-29T08:08:00.000Z",
          },
        ],
      }),
    ).toEqual([]);
  });
});
