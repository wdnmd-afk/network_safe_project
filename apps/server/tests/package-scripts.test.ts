import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("server package exposes lab metadata seed script", async () => {
  const packageJson = JSON.parse(
    await readFile(path.resolve(process.cwd(), "package.json"), "utf8"),
  ) as {
    scripts: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts["seed:labs"],
    "tsx ./scripts/seed-lab-metadata.ts",
  );
});
