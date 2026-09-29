import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// 写法与主项目 database/scripts/apply-migrations.mjs 同构。
// 迁移记录表使用独立名称 nsm_schema_migrations，避免与主项目
// network_safe_schema_migrations 互相污染——两个仓库共用同一个库。
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const defaultEnvPath = path.join(repositoryRoot, "apps/admin-server/.env");
const defaultMigrationsDirectory = path.join(repositoryRoot, "database/migrations");
export const migrationTableName = "nsm_schema_migrations";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
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

export function parseDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("缺少 DATABASE_URL，请先配置 apps/admin-server/.env");
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

  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));

  if (!database) {
    throw new Error("DATABASE_URL 缺少数据库名称");
  }

  return {
    host: parsed.hostname || "localhost",
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username) || "root",
    password: decodeURIComponent(parsed.password),
    database,
  };
}

function quoteIdentifier(value) {
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

function sanitize(message, password) {
  const text = String(message || "").trim();
  return (password ? text.replaceAll(password, "[redacted]") : text).slice(0, 800);
}

function runMysql(config, sql) {
  const result = spawnSync(
    process.env.MYSQL_CLI_PATH ?? (process.platform === "win32" ? "mysql.exe" : "mysql"),
    [
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
      "--database",
      config.database,
    ],
    {
      cwd: repositoryRoot,
      // 通过环境变量传递密码，避免密码进入进程命令行参数
      env: { ...process.env, MYSQL_PWD: config.password },
      input: sql,
      encoding: "utf8",
      windowsHide: true,
    },
  );

  if (result.error) {
    throw new Error(`无法执行 MySQL 客户端：${sanitize(result.error.message, config.password)}`);
  }

  if (result.status !== 0) {
    throw new Error(`MySQL 执行失败：${sanitize(result.stderr, config.password)}`);
  }

  return String(result.stdout ?? "").trim();
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
  );
}

function getAppliedMigrations(config) {
  const output = runMysql(
    config,
    `SELECT migration_name FROM ${quoteIdentifier(migrationTableName)} ORDER BY migration_name;`,
  );
  return new Set(output ? output.split(/\r?\n/).filter(Boolean) : []);
}

/**
 * 管理端不负责建库：库由主项目 pnpm db:prepare 创建。
 * 这里库不存在会直接失败，提醒先初始化主项目，而不是悄悄建一个空库。
 */
export function applyMigrations({
  envPath = defaultEnvPath,
  migrationsDirectory = defaultMigrationsDirectory,
  statusOnly = false,
} = {}) {
  loadEnvFile(envPath);
  const config = parseDatabaseUrl(process.env.DATABASE_URL);
  const files = listMigrationFiles(migrationsDirectory);

  if (statusOnly) {
    const exists = runMysql(
      config,
      `SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${quoteString(migrationTableName)};`,
    );
    const applied = exists ? getAppliedMigrations(config) : new Set();
    return {
      database: config.database,
      applied: files.filter((name) => applied.has(name)),
      pending: files.filter((name) => !applied.has(name)),
      total: files.length,
    };
  }

  ensureMigrationTable(config);
  const applied = getAppliedMigrations(config);
  const appliedNow = [];

  for (const name of files) {
    if (applied.has(name)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDirectory, name), "utf8");

    if (!sql.trim()) {
      throw new Error(`迁移文件为空：${name}`);
    }

    console.log(`applying ${name}`);
    runMysql(config, sql);
    runMysql(
      config,
      `INSERT INTO ${quoteIdentifier(migrationTableName)} (migration_name) VALUES (${quoteString(name)});`,
    );
    appliedNow.push(name);
  }

  return {
    database: config.database,
    applied: appliedNow,
    pending: [],
    total: files.length,
  };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  try {
    const statusOnly = process.argv.includes("--status");
    const result = applyMigrations({ statusOnly });

    if (statusOnly) {
      console.log(`database: ${result.database}`);
      console.log(`applied: ${result.applied.length}/${result.total}`);
      if (result.pending.length > 0) {
        console.log(`pending: ${result.pending.join(", ")}`);
      }
    } else {
      console.log(
        `admin migrations ready: ${result.database}; applied ${result.applied.length}; total ${result.total}`,
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
