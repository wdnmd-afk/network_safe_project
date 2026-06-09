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
      total: 15,
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
