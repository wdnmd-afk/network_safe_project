import { describe, expect, it } from "vitest";

import {
  createSqlInjectionLearningProgress,
  createSqlInjectionVerificationRecord,
  formatSqlInjectionSignal,
  getSqlInjectionVariantConfig,
  sqlInjectionAttackPayload,
  sqlInjectionNormalKeyword,
} from "../src/labs/sql-injection";
import type { SqlInjectionSearchResult } from "../src/api/sql-injection-lab";

describe("SQL 注入纵向实验模型", () => {
  it("为漏洞版和修复版提供不同教学信号", () => {
    expect(getSqlInjectionVariantConfig("vuln")).toMatchObject({
      key: "vuln",
      badge: "字符串拼接查询",
    });
    expect(getSqlInjectionVariantConfig("fixed")).toMatchObject({
      key: "fixed",
      badge: "参数化查询",
    });
  });

  it("生成进入实验时的学习进度载荷", () => {
    expect(
      createSqlInjectionLearningProgress(
        getSqlInjectionVariantConfig("vuln"),
      ),
    ).toEqual({
      variantKey: "vuln",
      status: "in-progress",
      notes: "进入 SQL 注入漏洞版",
    });
  });

  it("生成漏洞版和修复版验证记录载荷", () => {
    const vulnerableResult: SqlInjectionSearchResult = {
      status: "ok",
      variantKey: "vuln",
      keyword: sqlInjectionAttackPayload,
      detectedInjection: true,
      queryMode: "unsafe-concat",
      queryPreview: "unsafe query",
      rows: [],
      signal: "sql-injection-data-exposed",
      decision: "accepted",
      message: "hidden data exposed",
      nextStep: "compare fixed",
    };
    const fixedResult: SqlInjectionSearchResult = {
      ...vulnerableResult,
      status: "blocked",
      variantKey: "fixed",
      queryMode: "parameterized",
      signal: "sql-injection-parameterized-blocked",
      decision: "blocked",
    };

    expect(
      createSqlInjectionVerificationRecord(
        getSqlInjectionVariantConfig("vuln"),
        vulnerableResult,
      ),
    ).toEqual({
      variantKey: "vuln",
      result: "passed",
      summary: "漏洞版接受了 SQL 注入样例，隐藏商品被返回。",
      details: {
        signal: "sql-injection-data-exposed",
        queryMode: "unsafe-concat",
      },
    });
    expect(
      createSqlInjectionVerificationRecord(
        getSqlInjectionVariantConfig("fixed"),
        fixedResult,
      ),
    ).toEqual({
      variantKey: "fixed",
      result: "passed",
      summary: "修复版使用参数化查询，同样输入被阻断。",
      details: {
        signal: "sql-injection-parameterized-blocked",
        queryMode: "parameterized",
      },
    });
  });

  it("暴露本机受控样例和信号文案", () => {
    expect(sqlInjectionNormalKeyword).toBe("router");
    expect(sqlInjectionAttackPayload).toBe("%' OR 1=1 #");
    expect(formatSqlInjectionSignal("sql-injection-data-exposed")).toBe(
      "漏洞版返回了隐藏商品",
    );
  });
});
