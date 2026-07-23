import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const defaultEnvPath = path.join(repositoryRoot, "apps/server/.env");
const defaultMigrationsDirectory = path.join(repositoryRoot, "database/migrations");
const migrationTableName = "network_safe_schema_migrations";

const migrationObjects = new Map([
  [
    "20260608_init_platform.sql",
    [
      "users",
      "lab_categories",
      "labs",
      "lab_variants",
      "lab_tags",
      "lab_tag_relations",
      "learning_progress",
      "verification_records",
      "lab_run_records",
    ],
  ],
  ["20260625_add_lab_event_logs.sql", ["lab_event_logs"]],
  [
    "20260625_add_sql_injection_lab_products.sql",
    ["sql_injection_lab_products"],
  ],
  [
    "20260629_add_lab_recap_question_completions.sql",
    ["lab_recap_question_completions"],
  ],
]);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function decodeUrlPart(value) {
  return decodeURIComponent(value ?? "");
}

export function parseDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("缺少 DATABASE_URL，请先配置 apps/server/.env");
  }

  let parsed;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL 不是有效的 MySQL 连接地址");
  }

  if (parsed.protocol !== "mysql:") {
    throw new Error("DATABASE_URL 必须使用 mysql:// 协议");
  }

  const database = decodeUrlPart(parsed.pathname.replace(/^\/+/, ""));

  if (!database) {
    throw new Error("DATABASE_URL 缺少数据库名称");
  }

  const port = Number(parsed.port || 3306);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("DATABASE_URL 的端口无效");
  }

  return {
    host: parsed.hostname || "localhost",
    port,
    user: decodeUrlPart(parsed.username) || "root",
    password: decodeUrlPart(parsed.password),
    database,
  };
}

export function quoteIdentifier(value) {
  if (!value) {
    throw new Error("SQL 标识符不能为空");
  }

  return `\`${String(value).replaceAll("`", "``")}\``;
}

function quoteString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function listMigrationFiles(migrationsDirectory = defaultMigrationsDirectory) {
  return fs
    .readdirSync(migrationsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function resolveMysqlCli() {
  if (process.env.MYSQL_CLI_PATH) {
    return process.env.MYSQL_CLI_PATH;
  }

  return process.platform === "win32" ? "mysql.exe" : "mysql";
}

function sanitizeErrorMessage(message, password) {
  const text = String(message || "").trim();

  if (!password) {
    return text.slice(0, 800);
  }

  return text.replaceAll(password, "[redacted]").slice(0, 800);
}

function runMysql(config, sql, { database } = {}) {
  const args = [
    "--protocol=tcp",
    "--host",
    config.host,
    "--port",
    String(config.port),
    "--user",
    config.user,
    "--batch",
    "--skip-column-names",
    "--raw",
    "--default-character-set=utf8mb4",
  ];

  if (database) {
    args.push("--database", database);
  }

  const result = spawnSync(resolveMysqlCli(), args, {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      // 通过环境变量传递密码，避免密码进入进程命令行参数。
      MYSQL_PWD: config.password,
    },
    input: sql,
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.error) {
    throw new Error(
      `无法执行 MySQL 客户端：${sanitizeErrorMessage(result.error.message, config.password)}`,
    );
  }

  if (result.status !== 0) {
    throw new Error(
      `MySQL 执行失败：${sanitizeErrorMessage(result.stderr, config.password)}`,
    );
  }

  return String(result.stdout ?? "").trim();
}

function ensureDatabase(config) {
  runMysql(
    config,
    `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(config.database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  );
}

function ensureMigrationTable(config) {
  runMysql(
    config,
    `CREATE TABLE IF NOT EXISTS ${quoteIdentifier(migrationTableName)} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      migration_name VARCHAR(255) NOT NULL,
      applied_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
      PRIMARY KEY (id),
      UNIQUE KEY migration_name_unique (migration_name)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    { database: config.database },
  );
}

function getAppliedMigrations(config) {
  const output = runMysql(
    config,
    `SELECT migration_name FROM ${quoteIdentifier(migrationTableName)} ORDER BY migration_name;`,
    { database: config.database },
  );

  return new Set(output ? output.split(/\r?\n/).filter(Boolean) : []);
}

function getExistingTables(config) {
  const output = runMysql(
    config,
    "SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE';",
    { database: config.database },
  );

  return new Set(output ? output.split(/\r?\n/).filter(Boolean) : []);
}

function hasMigrationObjects(migrationName, existingTables) {
  const requiredObjects = migrationObjects.get(migrationName) ?? [];
  return requiredObjects.length > 0 && requiredObjects.every((name) => existingTables.has(name));
}

function recordMigration(config, migrationName) {
  runMysql(
    config,
    `INSERT INTO ${quoteIdentifier(migrationTableName)} (migration_name) VALUES (${quoteString(migrationName)});`,
    { database: config.database },
  );
}

function validateRecordedObjects(migrationName, existingTables) {
  const requiredObjects = migrationObjects.get(migrationName) ?? [];
  const missing = requiredObjects.filter((name) => !existingTables.has(name));

  if (missing.length > 0) {
    throw new Error(
      `迁移 ${migrationName} 已记录，但缺少对象：${missing.join(", ")}`,
    );
  }
}

export function applyMigrations({
  databaseUrl = process.env.DATABASE_URL,
  envPath = defaultEnvPath,
  migrationsDirectory = defaultMigrationsDirectory,
  baselineExisting = false,
} = {}) {
  loadEnvFile(envPath);
  const config = parseDatabaseUrl(databaseUrl ?? process.env.DATABASE_URL);
  const migrationFiles = listMigrationFiles(migrationsDirectory);

  if (migrationFiles.length === 0) {
    throw new Error("没有找到 database/migrations/*.sql");
  }

  ensureDatabase(config);
  ensureMigrationTable(config);

  const applied = getAppliedMigrations(config);
  let existingTables = getExistingTables(config);
  const appliedNow = [];
  const skipped = [];

  for (const migrationName of migrationFiles) {
    if (applied.has(migrationName)) {
      validateRecordedObjects(migrationName, existingTables);
      skipped.push(migrationName);
      continue;
    }

    if (baselineExisting && hasMigrationObjects(migrationName, existingTables)) {
      recordMigration(config, migrationName);
      applied.add(migrationName);
      skipped.push(`${migrationName} (baseline)`);
      continue;
    }

    const migrationPath = path.join(migrationsDirectory, migrationName);
    const sql = fs.readFileSync(migrationPath, "utf8");

    if (!sql.trim()) {
      throw new Error(`迁移文件为空：${migrationName}`);
    }

    console.log(`applying ${migrationName}`);
    runMysql(config, sql, { database: config.database });
    recordMigration(config, migrationName);
    applied.add(migrationName);
    existingTables = getExistingTables(config);
    appliedNow.push(migrationName);
  }

  return {
    database: config.database,
    applied: appliedNow,
    skipped,
    total: migrationFiles.length,
  };
}

function isMainModule() {
  return process.argv[1]
    ? path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
    : false;
}

if (isMainModule()) {
  try {
    const result = applyMigrations({
      baselineExisting: process.argv.includes("--baseline-existing"),
    });

    console.log(
      `database ready: ${result.database}; applied ${result.applied.length}; skipped ${result.skipped.length}; total ${result.total}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
