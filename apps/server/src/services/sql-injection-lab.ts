import { prisma } from "../lib/prisma.js";

export type SqlInjectionVariantKey = "vuln" | "fixed";

export type SqlInjectionSignal =
  | "sql-injection-normal-search"
  | "sql-injection-data-exposed"
  | "sql-injection-parameterized-blocked"
  | "sql-injection-safety-boundary-blocked"
  | "sql-injection-query-error";

export type SqlInjectionSearchStatus = "ok" | "blocked" | "failed";

export type SqlInjectionProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceCents: number;
  internalNote: string | null;
  isHidden: boolean;
};

export type SqlInjectionSearchInput = {
  variantKey: SqlInjectionVariantKey;
  keyword: string;
};

export type SqlInjectionSearchResult = {
  status: SqlInjectionSearchStatus;
  variantKey: SqlInjectionVariantKey;
  keyword: string;
  detectedInjection: boolean;
  queryMode: "unsafe-concat" | "parameterized";
  queryPreview: string;
  rows: SqlInjectionProduct[];
  signal: SqlInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

type RawSqlInjectionProduct = {
  id: bigint | number;
  sku: string;
  name: string;
  category: string;
  priceCents: number;
  internalNote: string | null;
  isHidden: boolean | number;
};

type SearchRepositoryResult = {
  queryPreview: string;
  rows: SqlInjectionProduct[];
};

export type SqlInjectionLabRepository = {
  searchWithUnsafeConcat(keyword: string): Promise<SearchRepositoryResult>;
  searchWithParameterizedQuery(keyword: string): Promise<SearchRepositoryResult>;
};

export type SqlInjectionLabService = {
  searchProducts(input: SqlInjectionSearchInput): Promise<SqlInjectionSearchResult>;
};

const selectColumns = [
  "id",
  "sku",
  "name",
  "category",
  "price_cents AS priceCents",
  "internal_note AS internalNote",
  "is_hidden AS isHidden",
].join(", ");

const forbiddenSqlBoundaryPattern =
  /;|\b(drop|delete|update|insert|alter|create|truncate|replace|union|sleep|benchmark|outfile|load_file|information_schema)\b/i;

const injectionIntentPattern =
  /'|--|\/\*|\bor\b\s+\d+\s*=\s*\d+|\bor\b\s+'[^']+'\s*=\s*'[^']+'/i;

function normalizeBoolean(value: boolean | number) {
  return value === true || value === 1;
}

function normalizeRow(row: RawSqlInjectionProduct): SqlInjectionProduct {
  return {
    id: row.id.toString(),
    sku: row.sku,
    name: row.name,
    category: row.category,
    priceCents: row.priceCents,
    internalNote: row.internalNote,
    isHidden: normalizeBoolean(row.isHidden),
  };
}

function detectInjectionIntent(keyword: string) {
  return injectionIntentPattern.test(keyword);
}

function violatesSafetyBoundary(keyword: string) {
  return forbiddenSqlBoundaryPattern.test(keyword);
}

function createQueryErrorResult(
  input: SqlInjectionSearchInput,
  error: unknown,
): SqlInjectionSearchResult {
  const errorMessage = error instanceof Error ? error.message : "unknown query error";

  return {
    status: "failed",
    variantKey: input.variantKey,
    keyword: input.keyword,
    detectedInjection: detectInjectionIntent(input.keyword),
    queryMode: input.variantKey === "vuln" ? "unsafe-concat" : "parameterized",
    queryPreview: "",
    rows: [],
    signal: "sql-injection-query-error",
    decision: "failed",
    message: "查询语句无法执行，观察到输入已经破坏了 SQL 结构。",
    nextStep: "回到固定攻击样例，先观察可控的布尔条件注入差异。",
    blockedReason: errorMessage,
  };
}

function createDefaultSqlInjectionLabRepository(): SqlInjectionLabRepository {
  return {
    async searchWithUnsafeConcat(keyword) {
      const queryPreview = `SELECT ${selectColumns} FROM sql_injection_lab_products WHERE is_deleted = 0 AND name LIKE '%${keyword}%' AND is_hidden = 0 ORDER BY id ASC`;
      const rows = await prisma.$queryRawUnsafe<RawSqlInjectionProduct[]>(
        queryPreview,
      );

      return {
        queryPreview,
        rows: rows.map(normalizeRow),
      };
    },

    async searchWithParameterizedQuery(keyword) {
      const queryPreview = `SELECT ${selectColumns} FROM sql_injection_lab_products WHERE is_deleted = 0 AND is_hidden = 0 AND name LIKE ? ORDER BY id ASC`;
      const pattern = `%${keyword}%`;
      const rows = await prisma.$queryRaw<RawSqlInjectionProduct[]>`
        SELECT
          id,
          sku,
          name,
          category,
          price_cents AS priceCents,
          internal_note AS internalNote,
          is_hidden AS isHidden
        FROM sql_injection_lab_products
        WHERE is_deleted = 0
          AND is_hidden = 0
          AND name LIKE ${pattern}
        ORDER BY id ASC
      `;

      return {
        queryPreview,
        rows: rows.map(normalizeRow),
      };
    },
  };
}

export function createSqlInjectionLabService(
  repository: SqlInjectionLabRepository = createDefaultSqlInjectionLabRepository(),
): SqlInjectionLabService {
  return {
    async searchProducts(input) {
      const keyword = input.keyword.trim();
      const detectedInjection = detectInjectionIntent(keyword);
      const queryMode =
        input.variantKey === "vuln" ? "unsafe-concat" : "parameterized";

      if (violatesSafetyBoundary(keyword)) {
        return {
          status: "blocked",
          variantKey: input.variantKey,
          keyword,
          detectedInjection: true,
          queryMode,
          queryPreview: "",
          rows: [],
          signal: "sql-injection-safety-boundary-blocked",
          decision: "blocked",
          message: "该输入超出本机受控读数据实验边界，已被安全边界阻断。",
          nextStep: "使用页面提供的固定样例观察布尔条件注入，不尝试破坏性 SQL。",
          blockedReason: "unsafe-sql-keyword",
        };
      }

      try {
        if (input.variantKey === "fixed") {
          const result = await repository.searchWithParameterizedQuery(keyword);

          if (detectedInjection) {
            return {
              status: "blocked",
              variantKey: input.variantKey,
              keyword,
              detectedInjection,
              queryMode,
              queryPreview: result.queryPreview,
              rows: result.rows,
              signal: "sql-injection-parameterized-blocked",
              decision: "blocked",
              message: "修复版把输入作为参数值处理，攻击语义没有进入 SQL 结构。",
              nextStep: "切回漏洞版，用同样输入观察隐藏数据如何被错误返回。",
            };
          }

          return {
            status: "ok",
            variantKey: input.variantKey,
            keyword,
            detectedInjection,
            queryMode,
            queryPreview: result.queryPreview,
            rows: result.rows,
            signal: "sql-injection-normal-search",
            decision: "accepted",
            message: "修复版正常返回公开商品，参数化查询保持了业务结果。",
            nextStep: "填入攻击样例，观察参数化查询如何阻断 SQL 结构变化。",
          };
        }

        const result = await repository.searchWithUnsafeConcat(keyword);
        const containsHiddenRows = result.rows.some((row) => row.isHidden);

        if (detectedInjection && containsHiddenRows) {
          return {
            status: "ok",
            variantKey: input.variantKey,
            keyword,
            detectedInjection,
            queryMode,
            queryPreview: result.queryPreview,
            rows: result.rows,
            signal: "sql-injection-data-exposed",
            decision: "accepted",
            message: "漏洞版拼接 SQL 后接受了攻击语义，隐藏数据被返回。",
            nextStep: "切到修复版提交同样输入，观察参数化查询的阻断效果。",
          };
        }

        return {
          status: "ok",
          variantKey: input.variantKey,
          keyword,
          detectedInjection,
          queryMode,
          queryPreview: result.queryPreview,
          rows: result.rows,
          signal: "sql-injection-normal-search",
          decision: "accepted",
          message: "漏洞版完成普通搜索；此时还没有触发注入信号。",
          nextStep: "填入攻击样例，观察 WHERE 条件被改写后的结果差异。",
        };
      } catch (error) {
        return createQueryErrorResult(
          {
            ...input,
            keyword,
          },
          error,
        );
      }
    },
  };
}
