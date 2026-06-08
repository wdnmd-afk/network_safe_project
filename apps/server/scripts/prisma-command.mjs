import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");
const envPath = path.resolve(serverRoot, ".env");
const schemaPath = path.resolve(
  serverRoot,
  "../../database/schema/platform/schema.prisma",
);

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
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function runPrismaCommand(command) {
  loadEnvFile(envPath);

  process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL = "1";
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    "mysql://root:password@localhost:3306/network_safe_project";

  const prismaCliPath = require.resolve("prisma/build/index.js");
  const result = spawnSync(
    process.execPath,
    [prismaCliPath, command, "--schema", schemaPath],
    {
      cwd: serverRoot,
      env: process.env,
      stdio: "inherit",
    },
  );

  if (typeof result.status === "number") {
    process.exit(result.status);
  }

  process.exit(1);
}
