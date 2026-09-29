/**
 * 两仓库共库的 schema 漂移门禁。
 *
 * 背景：管理端与主项目直连同一个 MySQL 库。管理端 schema 是主项目 schema 的
 * 子集，一旦主项目改了列而管理端没跟上，管理端的查询会在运行期才炸。
 * 本门禁在提交前逐列比对，把这类漂移挡在前面。
 *
 * 比对范围：两侧都存在的模型，逐列比对 列名 / 类型 / 可空性 / @map / @db 属性 /
 * 默认值，并比对模型级 @@map、@@unique、@@index（含索引名）。
 * 只存在于管理端 schema 的模型（AdminAuditLog）不参与比对。
 *
 * 自检：每次运行都会对管理端 schema 做一次变异（把某个共享列的类型改掉），
 * 确认比对器能报出差异；报不出就判定门禁失效并失败。
 * 依据是 LT-046 的教训——首版契约门禁因漏判而形同虚设。
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const adminSchemaPath = path.join(
  repoRoot,
  "apps/admin-server/prisma/schema.prisma",
);
// 主项目是 management 的上级目录；可用 NSP_ROOT 覆盖以便独立检出时使用
const mainRoot = process.env.NSP_ROOT ?? path.resolve(repoRoot, "..");
const mainSchemaPath = path.join(
  mainRoot,
  "database/schema/platform/schema.prisma",
);

type FieldInfo = {
  name: string;
  type: string;
  optional: boolean;
  list: boolean;
  attributes: string;
};

export type ModelInfo = {
  name: string;
  mappedName: string | null;
  fields: Map<string, FieldInfo>;
  indexes: string[];
};

export function parseSchema(source: string): Map<string, ModelInfo> {
  const models = new Map<string, ModelInfo>();
  const modelPattern = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;

  for (const match of source.matchAll(modelPattern)) {
    const name = match[1];
    const body = match[2];
    const fields = new Map<string, FieldInfo>();
    const indexes: string[] = [];
    let mappedName: string | null = null;

    for (const rawLine of body.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("//") || line.startsWith("///")) {
        continue;
      }

      if (line.startsWith("@@")) {
        const mapped = /^@@map\("([^"]+)"\)/.exec(line);

        if (mapped) {
          mappedName = mapped[1];
          continue;
        }

        // 归一化空白，让格式差异不产生假阳性
        indexes.push(line.replace(/\s+/g, " "));
        continue;
      }

      const field = /^(\w+)\s+([A-Za-z_][\w.]*)(\[\])?(\?)?\s*(.*)$/.exec(line);

      if (!field) {
        continue;
      }

      fields.set(field[1], {
        name: field[1],
        type: field[2],
        list: Boolean(field[3]),
        optional: Boolean(field[4]),
        attributes: field[5].replace(/\s+/g, " ").trim(),
      });
    }

    models.set(name, {
      name,
      mappedName,
      fields,
      indexes: indexes.sort(),
    });
  }

  return models;
}

function isRelationField(field: FieldInfo, modelNames: Set<string>) {
  return modelNames.has(field.type.replace(/\[\]$/, ""));
}

export type DriftIssue = {
  model: string;
  detail: string;
};

export function compareSchemas(
  adminSource: string,
  mainSource: string,
): DriftIssue[] {
  const adminModels = parseSchema(adminSource);
  const mainModels = parseSchema(mainSource);
  const adminModelNames = new Set(adminModels.keys());
  const mainModelNames = new Set(mainModels.keys());
  const issues: DriftIssue[] = [];

  for (const [name, adminModel] of adminModels) {
    const mainModel = mainModels.get(name);

    // 只存在于管理端 schema 的模型是自有表，不参与比对
    if (!mainModel) {
      continue;
    }

    if (adminModel.mappedName !== mainModel.mappedName) {
      issues.push({
        model: name,
        detail: `@@map 不一致：管理端 ${adminModel.mappedName} / 主项目 ${mainModel.mappedName}`,
      });
    }

    for (const [fieldName, adminField] of adminModel.fields) {
      if (isRelationField(adminField, adminModelNames)) {
        continue;
      }

      const mainField = mainModel.fields.get(fieldName);

      if (!mainField) {
        issues.push({
          model: name,
          detail: `管理端多出列 ${fieldName}，主项目没有该列`,
        });
        continue;
      }

      const signature = (field: FieldInfo) =>
        `${field.type}${field.list ? "[]" : ""}${field.optional ? "?" : ""} ${field.attributes}`;

      if (signature(adminField) !== signature(mainField)) {
        issues.push({
          model: name,
          detail: `列 ${fieldName} 定义不一致：管理端「${signature(adminField)}」/ 主项目「${signature(mainField)}」`,
        });
      }
    }

    // 主项目有、管理端缺的标量列同样算漂移：管理端可能正准备查它
    for (const [fieldName, mainField] of mainModel.fields) {
      if (isRelationField(mainField, mainModelNames)) {
        continue;
      }

      if (!adminModel.fields.has(fieldName)) {
        issues.push({
          model: name,
          detail: `管理端缺少主项目的列 ${fieldName}`,
        });
      }
    }

    const adminIndexes = new Set(adminModel.indexes);
    const mainIndexes = new Set(mainModel.indexes);

    for (const index of mainIndexes) {
      if (!adminIndexes.has(index)) {
        issues.push({
          model: name,
          detail: `管理端缺少索引或唯一键定义：${index}`,
        });
      }
    }

    for (const index of adminIndexes) {
      if (!mainIndexes.has(index)) {
        issues.push({
          model: name,
          detail: `管理端多出索引或唯一键定义：${index}`,
        });
      }
    }
  }

  return issues;
}

function runSelfTest(adminSource: string, mainSource: string) {
  // 变异：把管理端 User.passwordHash 的类型改掉，比对器必须报出差异
  const mutated = adminSource.replace(
    /passwordHash\s+String\s+@map\("password_hash"\)\s+@db\.VarChar\(255\)/,
    'passwordHash String @map("password_hash") @db.VarChar(64)',
  );

  if (mutated === adminSource) {
    throw new Error(
      "schema 漂移门禁自检失败：无法在管理端 schema 中定位 User.passwordHash，变异未生效",
    );
  }

  const issues = compareSchemas(mutated, mainSource);

  if (issues.length === 0) {
    throw new Error(
      "schema 漂移门禁自检失败：注入一处列类型漂移后比对器未报错，门禁视为失效",
    );
  }

  // 变异检测有效后，再比对真实输入；两步合起来排除「比对器恒报错」与「恒不报错」
  return { clean: compareSchemas(adminSource, mainSource) };
}

const adminSource = readFileSync(adminSchemaPath, "utf8");
const mainSource = readFileSync(mainSchemaPath, "utf8");

try {
  const { clean } = runSelfTest(adminSource, mainSource);

  if (clean.length > 0) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          checkedAdminSchema: adminSchemaPath,
          checkedMainSchema: mainSchemaPath,
          drift: clean,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify(
        {
          ok: true,
          selfTest: "变异检测有效",
          checkedAdminSchema: adminSchemaPath,
          checkedMainSchema: mainSchemaPath,
          drift: [],
        },
        null,
        2,
      ),
    );
  }
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
}
