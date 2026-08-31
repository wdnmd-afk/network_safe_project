/**
 * 数据库 schema、迁移与 Prisma 模型一致性验证器（LT-049）
 *
 * 背景：仓库存在三处描述同一套表结构的来源——
 *   1. `database/migrations/*.sql`：真正建表的权威 DDL；
 *   2. `database/schema/platform/schema.prisma`：Prisma 客户端读取的模型；
 *   3. `apps/server/scripts/ensure-local-schema.mjs`：为已有库补齐缺失表的幂等入口。
 *
 * 三者此前无任何机械校验。新增 Prisma 模型却漏写迁移、或反之，都不会让任何
 * 门禁失败——直到运行期报"表不存在"或"字段不存在"。本验证器比对三方结构，
 * 使该类漂移在提交前暴露。
 *
 * 本脚本只解析仓库内文本，不连接数据库、不发起网络请求、不执行系统命令，
 * 因此可在无 MySQL 的环境（含 CI）运行。
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptFilePath), "..", "..");

const migrationsDir = path.join(repositoryRoot, "database/migrations");
const prismaSchemaPath = path.join(
  repositoryRoot,
  "database/schema/platform/schema.prisma",
);
const ensureScriptPath = path.join(
  repositoryRoot,
  "apps/server/scripts/ensure-local-schema.mjs",
);

/**
 * 已登记的"仅迁移建表、不进 Prisma 模型"例外。
 *
 * sql_injection_lab_products 供 web.sql-injection 实验演示不安全字符串拼接，
 * 服务端刻意使用 $queryRawUnsafe 与 $queryRaw 直连该表（见
 * apps/server/src/services/sql-injection-lab.ts）。原生查询不需要 Prisma 模型，
 * 因此它不在 schema.prisma 中属有意设计，不是漂移。
 *
 * 新增例外必须在此登记并写明理由，否则视为缺陷。
 */
const intentionalNonPrismaTables: Readonly<Record<string, string>> =
  Object.freeze({
    sql_injection_lab_products:
      "web.sql-injection 实验经 $queryRaw / $queryRawUnsafe 直连以演示不安全拼接，原生查询无需 Prisma 模型",
  });

export type SchemaCheck = {
  key: string;
  passed: boolean;
  message: string;
};

export type SchemaConsistencyReport = {
  scope: "local-repository-only";
  ok: boolean;
  migrationCount: number;
  migrationTableCount: number;
  prismaModelCount: number;
  checks: SchemaCheck[];
  notes: string[];
};

function createCheck(key: string, passed: boolean, message: string): SchemaCheck {
  return { key, passed, message };
}

/** 去掉 SQL 注释与字符串，避免注释里的示例 DDL 被当成真实语句 */
function stripSqlNoise(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/#[^\n]*/g, " ");
}

type TableShape = {
  table: string;
  columns: Set<string>;
  source: string;
};

/** 从一段 DDL 中解析出所有 CREATE TABLE 的表名与列名 */
function parseCreateTables(sql: string, source: string): TableShape[] {
  const cleaned = stripSqlNoise(sql);
  const shapes: TableShape[] = [];
  const tablePattern =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_]+)`?\s*\(/gi;

  let match: RegExpExecArray | null;
  while ((match = tablePattern.exec(cleaned)) !== null) {
    const table = match[1];
    // 从左括号开始做括号配平，取出该 CREATE TABLE 的完整定义体
    const bodyStart = match.index + match[0].length;
    let depth = 1;
    let cursor = bodyStart;
    while (cursor < cleaned.length && depth > 0) {
      const char = cleaned[cursor];
      if (char === "(") depth += 1;
      else if (char === ")") depth -= 1;
      cursor += 1;
    }
    const body = cleaned.slice(bodyStart, cursor - 1);

    const columns = new Set<string>();
    // 顶层逗号分隔的定义项中，以反引号列名开头的即为列定义；
    // PRIMARY KEY / UNIQUE / INDEX / CONSTRAINT 等以关键字开头，自然被跳过。
    let itemDepth = 0;
    let current = "";
    const items: string[] = [];
    for (const char of body) {
      if (char === "(") itemDepth += 1;
      if (char === ")") itemDepth -= 1;
      if (char === "," && itemDepth === 0) {
        items.push(current);
        current = "";
        continue;
      }
      current += char;
    }
    if (current.trim()) items.push(current);

    for (const item of items) {
      const columnMatch = item.trim().match(/^`([A-Za-z0-9_]+)`/);
      if (columnMatch) {
        columns.add(columnMatch[1]);
      }
    }

    shapes.push({ table, columns, source });
  }

  return shapes;
}

type PrismaModel = {
  model: string;
  table: string;
  columns: Set<string>;
};

/** 解析 schema.prisma，取出每个模型的 @@map 表名与实际列名（含 @map 重命名） */
function parsePrismaModels(schema: string): PrismaModel[] {
  const models: PrismaModel[] = [];
  const modelPattern = /model\s+([A-Za-z0-9_]+)\s*\{/g;

  let match: RegExpExecArray | null;
  while ((match = modelPattern.exec(schema)) !== null) {
    const model = match[1];
    const bodyStart = match.index + match[0].length;
    let depth = 1;
    let cursor = bodyStart;
    while (cursor < schema.length && depth > 0) {
      const char = schema[cursor];
      if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
      cursor += 1;
    }
    const body = schema.slice(bodyStart, cursor - 1);

    const mapMatch = body.match(/@@map\("([A-Za-z0-9_]+)"\)/);
    const table = mapMatch ? mapMatch[1] : model;

    const columns = new Set<string>();
    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue;

      const fieldMatch = line.match(/^([A-Za-z0-9_]+)\s+(\S+)/);
      if (!fieldMatch) continue;

      const [, fieldName, fieldType] = fieldMatch;
      // 关系字段（类型指向另一个模型且带 @relation，或为模型数组）不是数据库列
      const isRelation =
        line.includes("@relation") || /^[A-Z][A-Za-z0-9_]*\[\]$/.test(fieldType);
      if (isRelation) continue;

      const columnMapMatch = line.match(/@map\("([A-Za-z0-9_]+)"\)/);
      columns.add(columnMapMatch ? columnMapMatch[1] : fieldName);
    }

    models.push({ model, table, columns });
  }

  return models;
}

export function runSchemaConsistencyVerification(): SchemaConsistencyReport {
  const checks: SchemaCheck[] = [];

  const migrationFiles = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  // 迁移是权威 DDL：同一张表可能先由 CREATE 建立、再由后续迁移 ALTER 增列，
  // 因此按文件顺序合并列集合。
  const migrationTables = new Map<string, TableShape>();
  for (const file of migrationFiles) {
    const sql = readFileSync(path.join(migrationsDir, file), "utf8");
    for (const shape of parseCreateTables(sql, file)) {
      const existing = migrationTables.get(shape.table);
      if (existing) {
        for (const column of shape.columns) existing.columns.add(column);
      } else {
        migrationTables.set(shape.table, shape);
      }
    }
    // 合并 ALTER TABLE ... ADD COLUMN 增加的列
    const alterPattern =
      /ALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?\s+ADD\s+(?:COLUMN\s+)?`([A-Za-z0-9_]+)`/gi;
    let alterMatch: RegExpExecArray | null;
    const cleaned = stripSqlNoise(sql);
    while ((alterMatch = alterPattern.exec(cleaned)) !== null) {
      const target = migrationTables.get(alterMatch[1]);
      if (target) target.columns.add(alterMatch[2]);
    }
  }

  const prismaSchema = readFileSync(prismaSchemaPath, "utf8");
  const prismaModels = parsePrismaModels(prismaSchema);

  checks.push(
    createCheck(
      "sources-parsed",
      migrationFiles.length > 0 &&
        migrationTables.size > 0 &&
        prismaModels.length > 0,
      `解析到 ${migrationFiles.length} 个迁移文件、${migrationTables.size} 张迁移表、${prismaModels.length} 个 Prisma 模型。`,
    ),
  );

  // 检查一：每个 Prisma 模型的 @@map 表名都必须由迁移真实创建。
  // 反向缺失意味着运行期必然报"表不存在"。
  const modelsWithoutMigration = prismaModels.filter(
    (model) => !migrationTables.has(model.table),
  );
  checks.push(
    createCheck(
      "prisma-models-have-migration",
      modelsWithoutMigration.length === 0,
      modelsWithoutMigration.length === 0
        ? `${prismaModels.length} 个 Prisma 模型的表均由迁移创建。`
        : `以下 Prisma 模型无对应建表迁移：${modelsWithoutMigration
            .map((model) => `${model.model}(${model.table})`)
            .join(", ")}`,
    ),
  );

  // 检查二：迁移创建的每张表都应有 Prisma 模型，除已登记例外。
  const prismaTables = new Set(prismaModels.map((model) => model.table));
  const tablesWithoutModel = [...migrationTables.keys()].filter(
    (table) =>
      !prismaTables.has(table) && !(table in intentionalNonPrismaTables),
  );
  checks.push(
    createCheck(
      "migration-tables-have-model",
      tablesWithoutModel.length === 0,
      tablesWithoutModel.length === 0
        ? `迁移表均有 Prisma 模型或已登记例外（例外 ${Object.keys(intentionalNonPrismaTables).length} 项）。`
        : `以下迁移表既无 Prisma 模型也未登记例外：${tablesWithoutModel.join(", ")}`,
    ),
  );

  // 检查三：Prisma 模型声明的每个列，迁移中都必须存在。
  // 这是最容易出现的漂移：改了模型忘了写迁移。
  for (const model of prismaModels) {
    const migration = migrationTables.get(model.table);
    if (!migration) continue;

    const missingColumns = [...model.columns].filter(
      (column) => !migration.columns.has(column),
    );
    checks.push(
      createCheck(
        `columns-exist:${model.table}`,
        missingColumns.length === 0,
        missingColumns.length === 0
          ? `${model.table}: ${model.columns.size} 个模型列均在迁移中存在。`
          : `${model.table}: 模型声明但迁移中不存在的列 —— ${missingColumns.join(", ")}`,
      ),
    );
  }

  // 检查四：schema:ensure 补齐的表必须是迁移中真实存在的表，
  // 否则它会在旧库上建出与迁移不一致的结构。
  const ensureScript = readFileSync(ensureScriptPath, "utf8");
  const ensureTables = [
    ...parseCreateTables(ensureScript.replace(/\\`/g, "`"), "ensure-local-schema.mjs"),
  ].map((shape) => shape.table);
  const ensureUnknown = ensureTables.filter(
    (table) => !migrationTables.has(table),
  );
  checks.push(
    createCheck(
      "ensure-script-tables-known",
      ensureUnknown.length === 0,
      ensureUnknown.length === 0
        ? `schema:ensure 涉及的 ${ensureTables.length} 张表均在迁移中定义。`
        : `schema:ensure 会创建迁移中不存在的表：${ensureUnknown.join(", ")}`,
    ),
  );

  return {
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    migrationCount: migrationFiles.length,
    migrationTableCount: migrationTables.size,
    prismaModelCount: prismaModels.length,
    checks,
    notes: [
      "本验证器只解析仓库内 SQL 与 Prisma 文本，不连接数据库，可在无 MySQL 环境运行。",
      "迁移 DDL 视为权威来源；Prisma 模型与 schema:ensure 与之比对。",
      "仅迁移建表而不进 Prisma 模型的情况需在 intentionalNonPrismaTables 中登记理由。",
      "本验证器不校验列类型与索引，只校验表与列的存在性；类型漂移仍需人工复核。",
    ],
  };
}

async function main() {
  const report = runSchemaConsistencyVerification();
  const failed = report.checks.filter((check) => !check.passed);

  console.log(
    JSON.stringify(
      {
        scope: report.scope,
        ok: report.ok,
        migrationCount: report.migrationCount,
        migrationTableCount: report.migrationTableCount,
        prismaModelCount: report.prismaModelCount,
        checkCount: report.checks.length,
        failedCount: failed.length,
        failed,
        notes: report.notes,
      },
      null,
      2,
    ),
  );

  if (!report.ok) {
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void main();
}
