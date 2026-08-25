import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "../../packages/shared/src/lab-metadata.js";
import {
  verifyWebEntrypointConsistency,
  type WebEntrypointConsistencyError,
} from "../../apps/web/src/router/entrypoint-consistency.js";
import { routes } from "../../apps/web/src/router/routes.js";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "../..");
const labsDirectory = path.join(repositoryRoot, "labs");

function collectMetadataFiles(directory: string, output: string[] = []) {
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

function loadMetadata() {
  const metadata: LabMetadata[] = [];
  const errors: WebEntrypointConsistencyError[] = [];

  for (const filePath of collectMetadataFiles(labsDirectory).sort()) {
    const relativePath = path.relative(repositoryRoot, filePath).replaceAll("\\", "/");
    const parsed = parseLabMetadataJson(fs.readFileSync(filePath, "utf8"));

    if (!parsed.ok) {
      errors.push({
        code: "metadata-json-parse",
        labId: relativePath,
        message: `${relativePath}: ${parsed.errors.join("; ")}`,
      });
      continue;
    }

    const validation = validateLabMetadata(parsed.value);

    if (!validation.ok) {
      errors.push({
        code: "metadata-schema",
        labId: relativePath,
        message: `${relativePath}: ${validation.errors.join("; ")}`,
      });
      continue;
    }

    metadata.push(validation.value);
  }

  return { metadata, errors };
}

export function verifyRepositoryWebEntrypoints() {
  const loaded = loadMetadata();
  const report = verifyWebEntrypointConsistency(loaded.metadata, routes);
  const errors = [...loaded.errors, ...report.errors];

  return {
    ...report,
    ok: errors.length === 0,
    errors,
  };
}

function isMainModule() {
  return process.argv[1]
    ? path.resolve(process.argv[1]) === path.resolve(scriptPath)
    : false;
}

if (isMainModule()) {
  const report = verifyRepositoryWebEntrypoints();
  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}
