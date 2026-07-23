import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const templatePath = path.join(repositoryRoot, "nginx/network-safe.conf.template");
const template = fs.readFileSync(templatePath, "utf8");

test("nginx template declares all generated path and port placeholders", () => {
  for (const placeholder of [
    "__NGINX_ERROR_LOG__",
    "__NGINX_PID__",
    "__NGINX_MIME_TYPES__",
    "__NGINX_ACCESS_LOG__",
    "__WEB_ROOT__",
    "__LISTEN_PORT__",
    "__SERVER_PORT__",
  ]) {
    assert.ok(template.includes(placeholder));
  }
});

test("nginx template preserves the API path and Vue history fallback", () => {
  assert.match(template, /location \/api\//);
  assert.match(template, /proxy_pass http:\/\/127\.0\.0\.1:__SERVER_PORT__/);
  assert.match(template, /try_files \$uri \$uri\/ \/index\.html;/);
});

test("nginx template does not contain a personal absolute workspace path", () => {
  assert.doesNotMatch(template, /E:\\/i);
  assert.doesNotMatch(template, /C:\\/i);
});

test("nginx generator is stored under the release tooling boundary", () => {
  assert.ok(
    fs.existsSync(path.join(repositoryRoot, "tools/release/generate-nginx-config.ps1")),
  );
  assert.ok(
    fs.existsSync(path.join(repositoryRoot, "tools/release/test-nginx-runtime.ps1")),
  );
});
