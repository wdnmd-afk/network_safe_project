import type {
  SqlInjectionSearchResult,
  SqlInjectionSignal,
  SqlInjectionVariantKey,
} from "../api/sql-injection-lab";

export type { SqlInjectionVariantKey };

export type SqlInjectionVariantConfig = {
  key: SqlInjectionVariantKey;
  title: string;
  badge: string;
  explanation: string;
  expectedSignal: string;
};

export type SqlInjectionLearningProgressInput = {
  variantKey: SqlInjectionVariantKey;
  status: "in-progress";
  notes: string;
};

export type SqlInjectionVerificationRecordInput = {
  variantKey: SqlInjectionVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: SqlInjectionSignal;
    queryMode: SqlInjectionSearchResult["queryMode"];
  };
};

export const sqlInjectionNormalKeyword = "router";
export const sqlInjectionAttackPayload = "%' OR 1=1 #";

const sqlInjectionVariantConfigs: Record<
  SqlInjectionVariantKey,
  SqlInjectionVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "SQL 注入漏洞版",
    badge: "字符串拼接查询",
    explanation:
      "漏洞版模拟商品搜索接口直接拼接关键词生成 SQL，攻击者可以把输入变成条件片段，让隐藏数据被错误返回。",
    expectedSignal:
      "提交攻击样例后应出现 sql-injection-data-exposed 信号，并看到隐藏商品。",
  },
  fixed: {
    key: "fixed",
    title: "SQL 注入修复版",
    badge: "参数化查询",
    explanation:
      "修复版把关键词作为参数值传给数据库，同样的攻击样例只会被当作普通文本，不会改变 WHERE 条件结构。",
    expectedSignal:
      "提交攻击样例后应出现 sql-injection-parameterized-blocked 信号。",
  },
};

export function getSqlInjectionVariantConfig(variant: SqlInjectionVariantKey) {
  return sqlInjectionVariantConfigs[variant];
}

export function createSqlInjectionLearningProgress(
  config: SqlInjectionVariantConfig,
): SqlInjectionLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createSqlInjectionVerificationRecord(
  config: SqlInjectionVariantConfig,
  result: SqlInjectionSearchResult,
): SqlInjectionVerificationRecordInput {
  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版接受了 SQL 注入样例，隐藏商品被返回。",
      details: {
        signal: result.signal,
        queryMode: result.queryMode,
      },
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版使用参数化查询，同样输入被阻断。",
    details: {
      signal: result.signal,
      queryMode: result.queryMode,
    },
  };
}

export function formatSqlInjectionSignal(signal: SqlInjectionSignal) {
  const labels: Record<SqlInjectionSignal, string> = {
    "sql-injection-normal-search": "正常搜索，只返回公开商品",
    "sql-injection-data-exposed": "漏洞版返回了隐藏商品",
    "sql-injection-parameterized-blocked": "修复版阻断了注入语义",
    "sql-injection-safety-boundary-blocked": "输入超出本机实验边界",
    "sql-injection-query-error": "输入破坏了 SQL 结构，查询失败",
  };

  return labels[signal];
}
