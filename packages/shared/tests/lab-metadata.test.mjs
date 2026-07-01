import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  labMetadataStatuses,
  parseLabMetadataJson,
  validateLabMetadata,
} from "../src/lab-metadata.js";

async function readFixture(relativePath) {
  const filePath = path.resolve(process.cwd(), "../..", relativePath);
  const result = parseLabMetadataJson(await readFile(filePath, "utf8"));

  assert.equal(result.ok, true);

  return result.value;
}

function createReadyCaseStudyMetadata() {
  return {
    id: "web.example-case-study",
    slug: "example-case-study",
    title: "案例化 ready 示例",
    category: "web",
    subcategory: "example-case-study",
    mode: "case-study",
    severity: "medium",
    difficulty: "intermediate",
    summary: "用于验证 case-study ready 元数据规则的最小样例。",
    status: "ready",
    tags: ["web", "case-study"],
    knowledgePoints: ["案例化 ready 边界"],
    variants: [
      {
        key: "vuln",
        title: "漏洞版案例",
        enabled: true,
        description: "案例化漏洞版入口。",
        entryKey: "vuln-entry",
        expectedOutcome: "观察漏洞版案例差异。",
        supportsAutomation: false,
      },
      {
        key: "fixed",
        title: "修复版案例",
        enabled: true,
        description: "案例化修复版入口。",
        entryKey: "fixed-entry",
        expectedOutcome: "观察修复版案例差异。",
        supportsAutomation: false,
      },
    ],
    entrypoints: {
      web: [],
      api: [],
      scripts: [],
      docs: [],
    },
    verification: {
      manual: {
        supported: true,
        stepsDocPath: "labs/web/example-case-study/docs/manual-verification.md",
        expectedSignals: ["case-study-ready-reviewed"],
      },
      automation: {
        supported: true,
        playwright: {
          enabled: true,
          specPath: "packages/testing/tests/e2e/platform.spec.mjs",
        },
        scriptVerification: {
          enabled: true,
          scriptKeys: ["example-case-study-verify"],
        },
      },
    },
    prerequisites: ["理解案例化 ready 不提供攻击脚本"],
    paths: {
      root: "labs/web/example-case-study",
      readme: "labs/web/example-case-study/README.md",
      vuln: "labs/web/example-case-study/vuln",
      fixed: "labs/web/example-case-study/fixed",
      mock: "labs/web/example-case-study/mock",
      docs: "labs/web/example-case-study/docs",
      scripts: "tools/lab-scripts/web/example-case-study",
    },
    safeBoundaries: [
      "case-study ready 状态仅表示案例、页面和只读验证形成闭环",
      "不连接真实外部目标",
    ],
    notes: "case-study ready 示例不提供 exploit.py 或攻击脚本。",
  };
}

test("validateLabMetadata accepts existing xss metadata", async () => {
  const metadata = await readFixture("labs/web/xss/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.xss");
  assert.equal(result.value.variants.length, 2);
});

test("xss metadata declares active automation and script verification entries", async () => {
  const metadata = await readFixture("labs/web/xss/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.status, "ready");
  assert.equal(result.value.verification.automation.supported, true);
  assert.deepEqual(result.value.verification.automation.playwright, {
    enabled: true,
    specPath: "packages/testing/tests/e2e/platform.spec.mjs",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["xss-verify"],
  });
  assert.deepEqual(result.value.entrypoints.scripts, [
    {
      key: "xss-verify",
      language: "ts",
      path: "tools/lab-scripts/web/xss/verify.ts",
      description: "本机受控 XSS 漏洞版与修复版差异验证配置",
    },
  ]);
});

test("csrf metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/csrf/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.csrf");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/web/csrf/vuln", "/labs/web/csrf/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/csrf/state",
      "/api/labs/web/csrf/vuln/transfer",
      "/api/labs/web/csrf/fixed/token",
      "/api/labs/web/csrf/fixed/transfer",
    ],
  );
  assert.deepEqual(result.value.verification.automation.playwright, {
    enabled: true,
    specPath: "packages/testing/tests/e2e/platform.spec.mjs",
  });
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/csrf-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["csrf-verify"],
  });
});

test("sql injection metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/sql-injection/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.sql-injection");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/web/sql-injection/vuln", "/labs/web/sql-injection/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/sql-injection/vuln/search",
      "/api/labs/web/sql-injection/fixed/search",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/sql-injection-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["sql-injection-verify"],
  });
});

test("nosql injection metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/nosql-injection/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.nosql-injection");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    [
      "/labs/web/nosql-injection/vuln",
      "/labs/web/nosql-injection/fixed",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/nosql-injection/vuln/search",
      "/api/labs/web/nosql-injection/fixed/search",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.scripts.map((entrypoint) => entrypoint.path),
    [
      "tools/lab-scripts/web/nosql-injection/exploit.py",
      "tools/lab-scripts/web/nosql-injection/verify.ts",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.docs.map((entrypoint) => entrypoint.path),
    [
      "labs/web/nosql-injection/README.md",
      "labs/web/nosql-injection/docs/attack-steps.md",
      "labs/web/nosql-injection/docs/fix-notes.md",
      "labs/web/nosql-injection/docs/manual-verification.md",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/nosql-injection-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["nosql-injection-verify"],
  });
});

test("crlf injection metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/crlf-injection/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.crlf-injection");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/web/crlf-injection/vuln", "/labs/web/crlf-injection/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/crlf-injection/vuln/preview",
      "/api/labs/web/crlf-injection/fixed/preview",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.scripts.map((entrypoint) => entrypoint.path),
    [
      "tools/lab-scripts/web/crlf-injection/exploit.py",
      "tools/lab-scripts/web/crlf-injection/verify.ts",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.docs.map((entrypoint) => entrypoint.path),
    [
      "labs/web/crlf-injection/README.md",
      "labs/web/crlf-injection/docs/attack-steps.md",
      "labs/web/crlf-injection/docs/fix-notes.md",
      "labs/web/crlf-injection/docs/manual-verification.md",
    ],
  );
  assert.equal(result.value.verification.automation.supported, true);
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/crlf-injection-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["crlf-injection-verify"],
  });
});

test("xpath injection metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/xpath-injection/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.xpath-injection");
  assert.equal(result.value.status, "ready");
  assert.equal(result.value.mode, "simulation");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    [
      "/labs/web/xpath-injection/vuln",
      "/labs/web/xpath-injection/fixed",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/xpath-injection/vuln/search",
      "/api/labs/web/xpath-injection/fixed/search",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.scripts.map((entrypoint) => entrypoint.path),
    [
      "tools/lab-scripts/web/xpath-injection/exploit.py",
      "tools/lab-scripts/web/xpath-injection/verify.ts",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.docs.map((entrypoint) => entrypoint.path),
    [
      "labs/web/xpath-injection/README.md",
      "labs/web/xpath-injection/docs/attack-steps.md",
      "labs/web/xpath-injection/docs/fix-notes.md",
      "labs/web/xpath-injection/docs/manual-verification.md",
    ],
  );
  assert.equal(result.value.verification.automation.supported, true);
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/xpath-injection-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["xpath-injection-verify"],
  });
});

test("ldap injection metadata exposes virtual workbench pages, virtual api and consistency script", async () => {
  const metadata = await readFixture("labs/web/ldap-injection/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.ldap-injection");
  assert.equal(result.value.status, "ready");
  assert.equal(result.value.mode, "case-study");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/web/ldap-injection/vuln", "/labs/web/ldap-injection/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/ldap-injection/vuln/search",
      "/api/labs/web/ldap-injection/fixed/search",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.scripts.map((entrypoint) => entrypoint.path),
    ["tools/lab-scripts/web/ldap-injection/verify.ts"],
  );
  assert.deepEqual(
    result.value.entrypoints.docs.map((entrypoint) => entrypoint.path),
    [
      "labs/web/ldap-injection/README.md",
      "labs/web/ldap-injection/docs/attack-steps.md",
      "labs/web/ldap-injection/docs/fix-notes.md",
      "labs/web/ldap-injection/docs/manual-verification.md",
    ],
  );
  assert.equal(result.value.verification.manual.supported, true);
  assert.equal(
    result.value.verification.manual.stepsDocPath,
    "labs/web/ldap-injection/docs/manual-verification.md",
  );
  assert.equal(result.value.verification.automation.supported, true);
  assert.deepEqual(result.value.verification.automation.playwright, {
    enabled: true,
    specPath: "packages/testing/tests/e2e/platform.spec.mjs",
  });
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/ldap-injection-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["ldap-injection-verify"],
  });
  assert.deepEqual(
    result.value.variants.map((variant) => variant.supportsAutomation),
    [false, false],
  );
  assert.deepEqual(
    result.value.variants.map((variant) => variant.entryKey),
    ["vuln-entry", "fixed-entry"],
  );
  assert.deepEqual(
    result.value.safeBoundaries.filter((boundary) =>
      boundary.includes("不连接真实 LDAP"),
    ),
    [
      "一期仅做案例化学习和受控虚拟目录工作台，不连接真实 LDAP、AD 或 OpenLDAP 服务",
    ],
  );
  assert.ok(
    result.value.safeBoundaries.some((boundary) =>
      boundary.includes("case-study") && boundary.includes("ready"),
    ),
  );
  assert.match(result.value.notes, /不提供 exploit\.py 或 LDAP 查询脚本/);
});

test("port scan metadata is ready virtual workbench simulation", async () => {
  const metadata = await readFixture("labs/network/port-scan/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "network.port-scan");
  assert.equal(result.value.status, "ready");
  assert.equal(result.value.mode, "simulation");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    [
      "/labs/network/port-scan/vuln",
      "/labs/network/port-scan/fixed",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/network/port-scan/vuln/scan",
      "/api/labs/network/port-scan/fixed/scan",
    ],
  );
  assert.deepEqual(result.value.entrypoints.scripts, [
    {
      key: "port-scan-verify",
      language: "ts",
      path: "tools/lab-scripts/network/port-scan/verify.ts",
      description: "本机只读端口扫描元数据、文档与虚拟边界一致性验证",
    },
  ]);
  assert.deepEqual(
    result.value.entrypoints.docs.map((entrypoint) => entrypoint.path),
    [
      "labs/network/port-scan/README.md",
      "labs/network/port-scan/docs/attack-steps.md",
      "labs/network/port-scan/docs/fix-notes.md",
      "labs/network/port-scan/docs/manual-verification.md",
    ],
  );
  assert.equal(result.value.verification.manual.supported, true);
  assert.equal(result.value.verification.automation.supported, true);
  assert.deepEqual(result.value.verification.automation.playwright, {
    enabled: true,
    specPath: "packages/testing/tests/e2e/platform.spec.mjs",
  });
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/port-scan-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["port-scan-verify"],
  });
  assert.deepEqual(
    result.value.variants.map((variant) => variant.supportsAutomation),
    [true, true],
  );
  assert.ok(
    result.value.safeBoundaries.some((boundary) =>
      boundary.includes("不调用真实 socket"),
    ),
  );
  assert.ok(
    result.value.safeBoundaries.some((boundary) =>
      boundary.includes("ready 状态仅表示"),
    ),
  );
  assert.match(result.value.notes, /不提供 exploit\.py/);
});

test("dns hijack metadata declares controlled web, api and readonly script entries", async () => {
  const metadata = await readFixture("labs/network/dns-hijack/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "network.dns-hijack");
  assert.equal(result.value.status, "in-progress");
  assert.equal(result.value.mode, "simulation");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    [
      "/labs/network/dns-hijack/vuln",
      "/labs/network/dns-hijack/fixed",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/network/dns-hijack/vuln/resolve",
      "/api/labs/network/dns-hijack/fixed/resolve",
    ],
  );
  assert.deepEqual(result.value.entrypoints.scripts, [
    {
      key: "dns-hijack-verify",
      language: "ts",
      path: "tools/lab-scripts/network/dns-hijack/verify.ts",
      description: "本机只读 DNS 劫持元数据、文档与虚拟边界一致性验证",
    },
  ]);
  assert.deepEqual(
    result.value.entrypoints.docs.map((entrypoint) => entrypoint.path),
    [
      "labs/network/dns-hijack/README.md",
      "labs/network/dns-hijack/docs/attack-steps.md",
      "labs/network/dns-hijack/docs/fix-notes.md",
      "labs/network/dns-hijack/docs/manual-verification.md",
    ],
  );
  assert.equal(result.value.verification.manual.supported, true);
  assert.equal(result.value.verification.automation.supported, true);
  assert.deepEqual(result.value.verification.automation.playwright, {
    enabled: true,
    specPath: "packages/testing/tests/e2e/platform.spec.mjs",
  });
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/dns-hijack-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["dns-hijack-verify"],
  });
  assert.deepEqual(
    result.value.variants.map((variant) => variant.supportsAutomation),
    [true, true],
  );
  assert.ok(
    result.value.safeBoundaries.some((boundary) =>
      boundary.includes("不修改本机 DNS"),
    ),
  );
  assert.ok(
    result.value.safeBoundaries.some((boundary) =>
      boundary.includes("不请求真实外部 DNS"),
    ),
  );
  assert.match(result.value.notes, /只读一致性验证阶段/);
  assert.match(result.value.notes, /尚未完成 ready 收口审计/);
  assert.match(result.value.notes, /不提供 exploit\.py/);
});

test("command injection metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/command-injection/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.command-injection");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    [
      "/labs/web/command-injection/vuln",
      "/labs/web/command-injection/fixed",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/command-injection/vuln/run",
      "/api/labs/web/command-injection/fixed/run",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/command-injection-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["command-injection-verify"],
  });
});

test("ssti metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/ssti/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.ssti");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/web/ssti/vuln", "/labs/web/ssti/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/ssti/vuln/preview",
      "/api/labs/web/ssti/fixed/preview",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/ssti-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["ssti-verify"],
  });
});

test("xxe metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/xxe/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.xxe");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/web/xxe/vuln", "/labs/web/xxe/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/xxe/vuln/import",
      "/api/labs/web/xxe/fixed/import",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/xxe-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["xxe-verify"],
  });
});

test("file upload metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/file-upload/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.file-upload");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/web/file-upload/vuln", "/labs/web/file-upload/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/file-upload/vuln/upload",
      "/api/labs/web/file-upload/fixed/upload",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/file-upload-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["file-upload-verify"],
  });
});

test("info disclosure metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/info-disclosure/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.info-disclosure");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    [
      "/labs/web/info-disclosure/vuln",
      "/labs/web/info-disclosure/fixed",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/info-disclosure/vuln/report",
      "/api/labs/web/info-disclosure/fixed/report",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/info-disclosure-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["info-disclosure-verify"],
  });
});

test("jwt metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/auth/jwt/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "auth.jwt");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/auth/jwt/vuln", "/labs/auth/jwt/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/auth/jwt/vuln/verify",
      "/api/labs/auth/jwt/fixed/verify",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/jwt-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["jwt-verify"],
  });
});

test("idor metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/auth/idor/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "auth.idor");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/auth/idor/vuln", "/labs/auth/idor/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/auth/idor/vuln/read",
      "/api/labs/auth/idor/fixed/read",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/idor-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["idor-verify"],
  });
});

test("privilege escalation metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture(
    "labs/auth/privilege-escalation/meta.json",
  );
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "auth.privilege-escalation");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    [
      "/labs/auth/privilege-escalation/vuln",
      "/labs/auth/privilege-escalation/fixed",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/auth/privilege-escalation/vuln/execute",
      "/api/labs/auth/privilege-escalation/fixed/execute",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/privilege-escalation-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["privilege-escalation-verify"],
  });
});

test("brute force metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/auth/brute-force/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "auth.brute-force");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/auth/brute-force/vuln", "/labs/auth/brute-force/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/auth/brute-force/vuln/attempt",
      "/api/labs/auth/brute-force/fixed/attempt",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/brute-force-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["brute-force-verify"],
  });
});

test("session fixation metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/auth/session-fixation/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "auth.session-fixation");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    [
      "/labs/auth/session-fixation/vuln",
      "/labs/auth/session-fixation/fixed",
    ],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/auth/session-fixation/vuln/login",
      "/api/labs/auth/session-fixation/fixed/login",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/session-fixation-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["session-fixation-verify"],
  });
});

test("path traversal metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/path-traversal/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.path-traversal");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/web/path-traversal/vuln", "/labs/web/path-traversal/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/path-traversal/vuln/read",
      "/api/labs/web/path-traversal/fixed/read",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/path-traversal-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["path-traversal-verify"],
  });
});

test("ssrf metadata declares web, api and script verification entries", async () => {
  const metadata = await readFixture("labs/web/ssrf/meta.json");
  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "web.ssrf");
  assert.equal(result.value.status, "ready");
  assert.deepEqual(
    result.value.entrypoints.web.map((entrypoint) => entrypoint.path),
    ["/labs/web/ssrf/vuln", "/labs/web/ssrf/fixed"],
  );
  assert.deepEqual(
    result.value.entrypoints.api.map((entrypoint) => entrypoint.path),
    [
      "/api/labs/web/ssrf/vuln/fetch",
      "/api/labs/web/ssrf/fixed/fetch",
    ],
  );
  assert.deepEqual(result.value.verification.automation.apiTest, {
    enabled: true,
    specPath: "apps/server/tests/ssrf-lab.test.ts",
  });
  assert.deepEqual(result.value.verification.automation.scriptVerification, {
    enabled: true,
    scriptKeys: ["ssrf-verify"],
  });
});

test("validateLabMetadata rejects missing required fields", () => {
  const result = validateLabMetadata({
    id: "web.demo",
    title: "Demo",
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /slug/);
  assert.match(result.errors.join("\n"), /category/);
});

test("validateLabMetadata accepts ready case-study metadata with explicit exception evidence", () => {
  const result = validateLabMetadata(createReadyCaseStudyMetadata());

  assert.equal(result.ok, true);
});

test("validateLabMetadata rejects ready case-study metadata without boundary and notes evidence", () => {
  const metadata = createReadyCaseStudyMetadata();
  metadata.safeBoundaries = ["不连接真实外部目标"];
  metadata.notes = "案例化实验已完成。";

  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, false);
  assert.ok(
    result.errors.includes(
      "ready case-study metadata must explain the case-study ready boundary",
    ),
  );
  assert.ok(
    result.errors.includes(
      "ready case-study metadata notes must explain that attack scripts are not provided",
    ),
  );
});

test("validateLabMetadata rejects ready case-study variants that declare attack script automation", () => {
  const metadata = createReadyCaseStudyMetadata();
  metadata.variants[0].supportsAutomation = true;

  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, false);
  assert.ok(
    result.errors.includes(
      "ready case-study variants must not declare attack script automation",
    ),
  );
});

test("validateLabMetadata rejects ready case-study metadata with weak automation evidence", () => {
  const metadata = createReadyCaseStudyMetadata();
  metadata.verification.automation = {
    supported: true,
    scriptVerification: {
      enabled: true,
      scriptKeys: ["example-case-study-verify"],
    },
  };

  const result = validateLabMetadata(metadata);

  assert.equal(result.ok, false);
  assert.ok(
    result.errors.includes(
      "ready case-study metadata must include at least two automation evidence types",
    ),
  );
});

test("labMetadataStatuses exposes documented status values", () => {
  assert.deepEqual(labMetadataStatuses, [
    "planned",
    "in-progress",
    "ready",
    "deprecated",
  ]);
});

test("parseLabMetadataJson accepts utf8 bom json", () => {
  const result = parseLabMetadataJson('\uFEFF{"id":"web.demo"}');

  assert.deepEqual(result, {
    ok: true,
    value: {
      id: "web.demo",
    },
  });
});
