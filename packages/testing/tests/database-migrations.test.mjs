import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  listMigrationFiles,
  parseDatabaseUrl,
  quoteIdentifier,
} from "../../../database/scripts/apply-migrations.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

test("parseDatabaseUrl reads the confirmed MySQL connection fields", () => {
  assert.deepEqual(
    parseDatabaseUrl("mysql://lab_user:p%40ss@127.0.0.1:3307/lab_db"),
    {
      host: "127.0.0.1",
      port: 3307,
      user: "lab_user",
      password: "p@ss",
      database: "lab_db",
    },
  );
});

test("parseDatabaseUrl rejects a non-MySQL connection", () => {
  assert.throws(
    () => parseDatabaseUrl("postgresql://user:password@localhost:5432/lab_db"),
    /mysql:\/\//,
  );
});

test("quoteIdentifier escapes backticks without accepting empty names", () => {
  assert.equal(quoteIdentifier("safe_table"), "`safe_table`");
  assert.equal(quoteIdentifier("a`b"), "`a``b`");
  assert.throws(() => quoteIdentifier(""), /不能为空/);
});

test("listMigrationFiles returns the repository migrations in lexical order", () => {
  const migrationsDirectory = path.join(repositoryRoot, "database/migrations");
  const files = listMigrationFiles(migrationsDirectory);

  assert.deepEqual(files, [...files].sort());
  assert.equal(files.length, 4);
  assert.ok(files.every((file) => fs.existsSync(path.join(migrationsDirectory, file))));
});
