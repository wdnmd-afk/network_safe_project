import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedScenarioCatalog } from "../../packages/shared/src/guided-scenarios.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const defaultLabsDirectory = path.join(repositoryRoot, "labs");
const defaultMatrixPath = path.join(
  repositoryRoot,
  "docs/design/security-coverage-matrix.md",
);

function collectMetadataFiles(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      collectMetadataFiles(entryPath, output);
    } else if (entry.isFile() && entry.name === "meta.json") {
      output.push(entryPath);
    }
  }

  return output;
}

export function loadLabMetadata(labsDirectory = defaultLabsDirectory) {
  return collectMetadataFiles(labsDirectory)
    .map((filePath) => JSON.parse(fs.readFileSync(filePath, "utf8")))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function readCoverageRows(matrixPath = defaultMatrixPath) {
  const markdown = fs.readFileSync(matrixPath, "utf8");
  const rows = [];
  const rowPattern = /^\| `([a-z0-9-]+\.[a-z0-9-]+)` \| ([^|]+) \| ([^|]+) \|/gm;

  for (const match of markdown.matchAll(rowPattern)) {
    rows.push({
      id: match[1],
      mode: match[2].trim(),
      depth: match[3].trim(),
    });
  }

  return rows;
}

function countBy(items, field) {
  const result = {};

  for (const item of items) {
    const key = item[field];
    result[key] = (result[key] ?? 0) + 1;
  }

  return Object.fromEntries(
    Object.entries(result).sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function verifyCoverageMatrix({
  labsDirectory = defaultLabsDirectory,
  matrixPath = defaultMatrixPath,
} = {}) {
  const metadata = loadLabMetadata(labsDirectory);
  const rows = readCoverageRows(matrixPath);
  const guidedIds = new Set(guidedScenarioCatalog.map((scenario) => scenario.id));
  const metadataById = new Map(metadata.map((item) => [item.id, item]));
  const rowIds = rows.map((row) => row.id);
  const rowIdSet = new Set(rowIds);
  const errors = [];

  if (rows.length !== rowIdSet.size) {
    errors.push("coverage matrix contains duplicate scenario rows");
  }

  for (const item of metadata) {
    if (!rowIdSet.has(item.id)) {
      errors.push(`coverage matrix is missing ${item.id}`);
    }
  }

  for (const row of rows) {
    const item = metadataById.get(row.id);

    if (!item) {
      errors.push(`coverage matrix contains unknown scenario ${row.id}`);
      continue;
    }

    if (row.mode !== item.mode) {
      errors.push(
        `${row.id} mode mismatch: matrix=${row.mode}; metadata=${item.mode}`,
      );
    }

    const expectedDepth = guidedIds.has(row.id)
      ? "D2"
      : item.mode === "interactive"
        ? "D4"
        : "D3";

    if (!row.depth.startsWith(expectedDepth)) {
      errors.push(
        `${row.id} depth mismatch: matrix=${row.depth}; expected=${expectedDepth}`,
      );
    }
  }

  const summary = {
    total: metadata.length,
    matrixRows: rows.length,
    dedicated: metadata.filter((item) => !guidedIds.has(item.id)).length,
    guided: metadata.filter((item) => guidedIds.has(item.id)).length,
    modes: countBy(metadata, "mode"),
    categories: countBy(metadata, "category"),
    playwright: metadata.filter(
      (item) => item.verification?.automation?.playwright?.enabled === true,
    ).length,
    errors,
    ok: errors.length === 0,
  };

  return summary;
}

function isMainModule() {
  return process.argv[1]
    ? path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
    : false;
}

if (isMainModule()) {
  const summary = verifyCoverageMatrix();
  console.log(JSON.stringify(summary, null, 2));

  if (!summary.ok) {
    process.exitCode = 1;
  }
}
