import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const testingRoot = path.resolve(path.dirname(currentFile), "../..");
const repoRoot = path.resolve(testingRoot, "../..");

export const smokeRuntime = {
  repoRoot,
  webRoot: path.join(repoRoot, "apps/web"),
  serverRoot: path.join(repoRoot, "apps/server"),
  webOrigin: "http://127.0.0.1:6670",
  apiOrigin: "http://127.0.0.1:6667",
  webPublicOrigin: "http://localhost:6670",
};

function countLocalLabMetadata() {
  const labsRoot = path.join(repoRoot, "labs");

  return fs
    .readdirSync(labsRoot, {
      withFileTypes: true,
    })
    .filter((category) => category.isDirectory())
    .flatMap((category) => {
      const categoryRoot = path.join(labsRoot, category.name);

      return fs
        .readdirSync(categoryRoot, {
          withFileTypes: true,
        })
        .filter((scene) => scene.isDirectory())
        .map((scene) => path.join(categoryRoot, scene.name, "meta.json"));
    })
    .filter((metadataPath) => fs.existsSync(metadataPath)).length;
}

export const expectedLabTotal = countLocalLabMetadata();

export const smokeChecks = [
  {
    name: "web-home",
    url: `${smokeRuntime.webOrigin}/`,
    kind: "text",
    expectedText: "SafeMart",
  },
  {
    name: "api-health-direct",
    url: `${smokeRuntime.apiOrigin}/api/health`,
    kind: "json",
    expectedJson: {
      status: "ok",
      service: "server",
    },
  },
  {
    name: "api-labs-direct",
    url: `${smokeRuntime.apiOrigin}/api/labs`,
    kind: "json",
    expectedJson: {
      total: expectedLabTotal,
    },
  },
  {
    name: "api-health-proxy",
    url: `${smokeRuntime.webOrigin}/api/health`,
    kind: "json",
    expectedJson: {
      status: "ok",
      service: "server",
    },
  },
];
