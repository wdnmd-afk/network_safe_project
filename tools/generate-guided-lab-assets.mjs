import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedScenarioCatalog } from "../packages/shared/src/guided-scenarios.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsOnly = process.argv.includes("--execution-docs-only");
const force = process.argv.includes("--force");
const generatedMarker = "由 tools/generate-guided-lab-assets.mjs 生成";

function normalizeContent(content) {
  return `${content.trim()}\n`;
}

function writeGenerated(relativePath, content) {
  const absolutePath = path.join(repoRoot, relativePath);
  const nextContent = normalizeContent(content);

  mkdirSync(path.dirname(absolutePath), { recursive: true });

  if (existsSync(absolutePath)) {
    const currentContent = readFileSync(absolutePath, "utf8");

    if (currentContent === nextContent) {
      return "unchanged";
    }

    if (!force && !currentContent.includes(generatedMarker)) {
      throw new Error(`refusing to overwrite non-generated file: ${relativePath}`);
    }
  }

  writeFileSync(absolutePath, nextContent, "utf8");
  return "written";
}

function executionDocPath(scenario) {
  return `docs/execution/2026-07-20-${scenario.category}-${scenario.subcategory}-guided-lab.md`;
}

function createExecutionDoc(scenario) {
  const fixedCase = scenario.scenarios[0];
  const blockedControl = scenario.controls[0];
  const acceptedControl = scenario.controls[1];

  return `<!-- ${generatedMarker} -->
# ${scenario.title}受控学习实验执行文档

## 1. 目标

在本机受控环境中完成 \`${scenario.id}\` 学习实验，使用固定 \`scenarioKey=${fixedCase.key}\` 对比漏洞版与修复版，帮助学习者理解${fixedCase.rootCause}以及对应防御策略。

本实验模式为 \`${scenario.mode}\`，状态达到 \`ready\` 只代表本项目内固定学习闭环可运行、可观察、可验证，不代表具备对外攻击能力。

## 2. 范围

- 建立标准目录 \`labs/${scenario.category}/${scenario.subcategory}/\`。
- 建立漏洞版 / 修复版通用工作台入口。
- 建立工作台配置 API 与受控评估 API。
- 评估 API 只接受固定 \`scenarioKey\` 和 \`controlKey\`。
- 关键动作写入统一 \`lab_event_logs\` 安全摘要。
- 建立独立只读验证脚本与自动化测试证据。
- 不新增真实目标、自由正文、凭据、Cookie、token、外部 URL、系统命令或第三方平台参数。

## 3. 操作步骤

1. 从共享目录读取 \`${scenario.id}\` 的准确字段和固定案例。
2. 生成实验元数据、README、漏洞版 / 修复版 / mock 说明和攻防文档。
3. 将 \`/labs/${scenario.category}/${scenario.subcategory}/vuln\` 与 \`/fixed\` 接入通用工作台。
4. 将工作台配置和评估请求接入通用受控服务。
5. 漏洞版使用 \`${blockedControl.key}\` 观察 \`${scenario.vulnerableOutcome.signal}\`。
6. 修复版使用 \`${blockedControl.key}\` 观察 \`${blockedControl.fixedSignal}\`。
7. 修复版使用 \`${acceptedControl.key}\` 验证正常受控流程仍可继续。
8. 评估结果写入统一事件日志，只记录固定 key、风险标签、决策和学习信号。
9. 运行独立 \`verify.ts\`、共享目录测试、API 测试和前端测试。

## 4. 实施建议

- 固定案例：${fixedCase.title}。
- 漏洞根因：${fixedCase.rootCause}。
- 核心防御：${acceptedControl.description}
- 页面只提供固定选项，不提供任意输入框。
- 未知 key 必须脱敏阻断，不得把原始未知值写入日志或响应。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 通用工作台读取错误字段 | 前后端行为漂移 | 只从共享目录读取 \`scenarioKey\`、\`controlKey\` 和结果字段 |
| 固定案例被扩展为真实能力 | 超出项目边界 | ${scenario.safeBoundaries[0]} |
| 日志保存原始输入 | 产生敏感数据风险 | 只记录固定 key 和计算后的安全摘要 |
| 仅页面可访问但无法验证 | 不能标记 ready | 独立脚本、API 测试和元数据测试同时提供证据 |

## 6. 优化方案

- 复用通用受控服务和工作台，避免重复实现安全校验与日志逻辑。
- 保留本实验独立元数据、文档、固定信号和验证入口，避免共享后失去学习语义。
- 后续若扩展案例，必须先更新共享目录和本执行文档，再同步生成产物与测试。

## 7. 验证方式

- \`pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/${scenario.category}/${scenario.subcategory}/verify.ts\`
- \`pnpm --filter @network-safe/shared test\`
- 通用服务与 API 测试逐项覆盖 \`${scenario.id}\`。
- 前端 API、路由和工作台组件测试。
- \`git diff --check\`。
- 安全关键词扫描，确认没有外部连接、真实凭据读取、网段扫描、任意命令执行、真实恶意样本或第三方投递能力。

## 8. 完成条件

- 漏洞版和修复版页面均可访问并能观察固定差异。
- API 对固定 key 返回准确结果，对未知 key 脱敏阻断。
- 事件日志只包含安全摘要。
- 元数据、页面、API、文档和脚本入口一致。
- \`verify.ts\` 输出 \`ok: true\`。
- ${scenario.mode === "case-study" ? "满足 case-study ready 例外，且 variants[].supportsAutomation 保持 false。" : "本机受控自动化验证覆盖关键差异。"}
`;
}

function createMetadata(scenario, index) {
  const root = `labs/${scenario.category}/${scenario.subcategory}`;
  const scriptsRoot = `tools/lab-scripts/${scenario.category}/${scenario.subcategory}`;
  const isCaseStudy = scenario.mode === "case-study";
  const scriptEntries = [
    {
      key: `${scenario.category}-${scenario.subcategory}-verify`,
      language: "ts",
      path: `${scriptsRoot}/verify.ts`,
      description: `${scenario.title}本机只读一致性验证`,
    },
  ];

  if (scenario.mode === "interactive") {
    scriptEntries.push({
      key: `${scenario.category}-${scenario.subcategory}-exploit`,
      language: "python",
      path: `${scriptsRoot}/exploit.py`,
      description: `${scenario.title}本机固定案例受控请求脚本`,
    });
  }

  return {
    id: scenario.id,
    slug: scenario.slug,
    title: scenario.title,
    category: scenario.category,
    subcategory: scenario.subcategory,
    mode: scenario.mode,
    severity: scenario.severity,
    difficulty: scenario.difficulty,
    summary: scenario.summary,
    status: "ready",
    phase: scenario.phase,
    sortOrder: 300 + index,
    estimatedMinutes: scenario.mode === "case-study" ? 20 : 25,
    tags: scenario.tags,
    knowledgePoints: scenario.knowledgePoints,
    variants: [
      {
        key: "vuln",
        title: `${scenario.title}风险观察版`,
        enabled: true,
        description: `观察${scenario.scenarios[0].rootCause}导致的固定风险判定。`,
        entryKey: `${scenario.category}-${scenario.subcategory}-vuln`,
        expectedOutcome: `返回 ${scenario.vulnerableOutcome.signal} 学习信号。`,
        supportsAutomation: !isCaseStudy,
      },
      {
        key: "fixed",
        title: `${scenario.title}防御复盘版`,
        enabled: true,
        description: `观察${scenario.controls[1].description}`,
        entryKey: `${scenario.category}-${scenario.subcategory}-fixed`,
        expectedOutcome: `高风险动作被阻断，正常受控流程通过复核。`,
        supportsAutomation: !isCaseStudy,
      },
    ],
    entrypoints: {
      web: [
        {
          key: `${scenario.category}-${scenario.subcategory}-vuln`,
          variant: "vuln",
          path: `/labs/${scenario.category}/${scenario.subcategory}/vuln`,
          description: `${scenario.title}风险观察版工作台`,
        },
        {
          key: `${scenario.category}-${scenario.subcategory}-fixed`,
          variant: "fixed",
          path: `/labs/${scenario.category}/${scenario.subcategory}/fixed`,
          description: `${scenario.title}防御复盘版工作台`,
        },
      ],
      api: [
        {
          key: `${scenario.category}-${scenario.subcategory}-workbench`,
          variant: "shared",
          method: "GET",
          path: `/api/labs/${scenario.category}/${scenario.subcategory}/workbench`,
          description: `${scenario.title}固定工作台配置`,
        },
        {
          key: `${scenario.category}-${scenario.subcategory}-vuln-evaluate`,
          variant: "vuln",
          method: "POST",
          path: `/api/labs/${scenario.category}/${scenario.subcategory}/vuln/evaluate`,
          description: `${scenario.title}漏洞版固定案例评估`,
        },
        {
          key: `${scenario.category}-${scenario.subcategory}-fixed-evaluate`,
          variant: "fixed",
          method: "POST",
          path: `/api/labs/${scenario.category}/${scenario.subcategory}/fixed/evaluate`,
          description: `${scenario.title}修复版固定案例评估`,
        },
      ],
      scripts: scriptEntries,
      docs: [
        {
          key: `${scenario.category}-${scenario.subcategory}-readme`,
          path: `${root}/README.md`,
          description: `${scenario.title}场景说明`,
        },
        {
          key: `${scenario.category}-${scenario.subcategory}-attack-steps`,
          path: `${root}/docs/attack-steps.md`,
          description: `${scenario.title}风险观察步骤`,
        },
        {
          key: `${scenario.category}-${scenario.subcategory}-fix-notes`,
          path: `${root}/docs/fix-notes.md`,
          description: `${scenario.title}修复思路`,
        },
        {
          key: `${scenario.category}-${scenario.subcategory}-manual-verification`,
          path: `${root}/docs/manual-verification.md`,
          description: `${scenario.title}手工验证矩阵`,
        },
      ],
    },
    verification: {
      manual: {
        supported: true,
        stepsDocPath: `${root}/docs/manual-verification.md`,
        expectedSignals: [
          scenario.vulnerableOutcome.signal,
          scenario.controls[0].fixedSignal,
          scenario.controls[1].fixedSignal,
        ],
      },
      automation: {
        supported: true,
        playwright: {
          enabled: false,
          specPath: "packages/testing/tests/e2e/platform.spec.mjs",
        },
        apiTest: {
          enabled: true,
          specPath: "apps/server/tests/guided-scenario-lab.test.ts",
        },
        scriptVerification: {
          enabled: true,
          scriptKeys: [`${scenario.category}-${scenario.subcategory}-verify`],
        },
      },
    },
    prerequisites: [
      {
        type: "service",
        value: "本机后端服务运行于 http://127.0.0.1:6667",
        required: true,
      },
      {
        type: "browser",
        value: "使用本机浏览器访问实验工作台",
        required: true,
      },
    ],
    safeBoundaries: [
      ...(isCaseStudy
        ? [`${scenario.title} 按 case-study ready 例外收口，只代表固定案例学习闭环完成。`]
        : []),
      ...scenario.safeBoundaries,
    ],
    paths: {
      root,
      readme: `${root}/README.md`,
      vuln: `${root}/vuln`,
      fixed: `${root}/fixed`,
      mock: `${root}/mock`,
      docs: `${root}/docs`,
      scripts: scriptsRoot,
    },
    references: [],
    notes: scenario.notes,
  };
}

function createReadme(scenario) {
  const fixedCase = scenario.scenarios[0];

  return `<!-- ${generatedMarker} -->
# ${scenario.title}

## 场景目标

${scenario.summary}

本实验只使用固定案例 \`${fixedCase.key}\`，用于观察${fixedCase.rootCause}，并对比漏洞版与修复版的后端判定、学习信号和统一事件日志。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要外部目标、第三方服务、真实凭据或真实业务数据。

## 使用方式

1. 访问 \`/labs/${scenario.category}/${scenario.subcategory}/vuln\`。
2. 使用固定案例和默认控制策略观察风险被接受。
3. 切换到 \`/labs/${scenario.category}/${scenario.subcategory}/fixed\`，观察高风险动作被阻断。
4. 选择“${scenario.controls[1].title}”，确认正常受控流程仍可继续。
5. 在实验详情或账户中心复盘统一事件日志。

## 安全边界

${scenario.safeBoundaries.map((boundary) => `- ${boundary}`).join("\n")}

${scenario.notes}
`;
}

function createVariantReadme(scenario, variant) {
  const isVulnerable = variant === "vuln";

  return `<!-- ${generatedMarker} -->
# ${scenario.title}${isVulnerable ? "风险观察版" : "防御复盘版"}

## 目标

${isVulnerable
    ? `观察${scenario.scenarios[0].rootCause}如何使固定高风险动作被接受。`
    : `观察${scenario.controls[1].description}`}

## 固定输入

- \`scenarioKey\`：\`${scenario.defaultScenarioKey}\`
- 默认 \`controlKey\`：\`${scenario.defaultControlKey}\`

## 预期结果

${isVulnerable
    ? `- 决策：\`accepted\`\n- 学习信号：\`${scenario.vulnerableOutcome.signal}\``
    : `- 默认高风险策略决策：\`blocked\`\n- 阻断信号：\`${scenario.controls[0].fixedSignal}\`\n- 正常受控信号：\`${scenario.controls[1].fixedSignal}\``}

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
`;
}

function createMockReadme(scenario) {
  return `<!-- ${generatedMarker} -->
# ${scenario.title}固定模拟数据

本目录不保存真实样本或真实业务材料。当前模拟数据由共享固定场景目录提供：

- 固定案例：\`${scenario.defaultScenarioKey}\`
- 风险标签：${scenario.scenarios[0].riskIndicators.map((item) => `\`${item}\``).join("、")}
- 固定控制策略：${scenario.controls.map((item) => `\`${item.key}\``).join("、")}

禁止在此加入真实凭据、真实网络数据、恶意样本、可投递内容、外部目标或第三方平台配置。
`;
}

function createAttackSteps(scenario) {
  return `<!-- ${generatedMarker} -->
# ${scenario.title}风险观察步骤

1. 登录本机学习平台。
2. 打开 \`/labs/${scenario.category}/${scenario.subcategory}/vuln\`。
3. 选择固定案例“${scenario.scenarios[0].title}”。
4. 选择“${scenario.controls[0].title}”。
5. 点击“运行固定评估”。
6. 观察决策 \`accepted\`、学习信号 \`${scenario.vulnerableOutcome.signal}\` 和风险标签。
7. 在统一事件日志中确认只记录固定 key 和安全摘要。

该流程只观察固定本机教学结果，不提供外部目标操作步骤。
`;
}

function createFixNotes(scenario) {
  return `<!-- ${generatedMarker} -->
# ${scenario.title}修复说明

## 根因

${scenario.scenarios[0].rootCause}。

## 修复策略

- ${scenario.controls[1].description}
- 未知 \`scenarioKey\` 或 \`controlKey\` 必须阻断且不回显原始值。
- 事件日志只记录固定 key、风险标签、后端决策和学习信号。
- 正常受控流程必须通过“${scenario.controls[1].title}”验证，不得一刀切破坏正常业务。

## 生产补充

真实生产环境还需要结合资产、身份、网络、终端、供应商和应急响应体系实施分层防护；本实验结果不能替代生产安全评估。
`;
}

function createManualVerification(scenario) {
  return `<!-- ${generatedMarker} -->
# ${scenario.title}手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | \`${scenario.defaultScenarioKey}\` | \`${scenario.controls[0].key}\` | \`accepted\` | \`${scenario.vulnerableOutcome.signal}\` |
| 修复版高风险 | \`${scenario.defaultScenarioKey}\` | \`${scenario.controls[0].key}\` | \`blocked\` | \`${scenario.controls[0].fixedSignal}\` |
| 修复版正常流程 | \`${scenario.defaultScenarioKey}\` | \`${scenario.controls[1].key}\` | \`accepted\` | \`${scenario.controls[1].fixedSignal}\` |
| 未知案例 | \`unknown-scenario\` | \`${scenario.controls[0].key}\` | \`blocked\` | \`guided-scenario-boundary-blocked\` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
`;
}

function createScriptReadme(scenario) {
  return `<!-- ${generatedMarker} -->
# ${scenario.title}实验脚本

## 只读验证

\`verify.ts\` 只读取仓库内共享场景目录、元数据、文档、通用前后端入口和测试文件，输出 JSON 一致性报告。

运行：

\`pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/${scenario.category}/${scenario.subcategory}/verify.ts\`

${scenario.mode === "interactive"
    ? "`exploit.py` 只向显式指定的 localhost / 127.0.0.1 后端发送固定案例请求，并要求临时 Bearer token；脚本不会保存 token。"
    : "本实验不提供 `exploit.py`，因为固定案例或状态模拟已经满足学习目标。"}

禁止将本目录扩展为外部扫描、投递、样本执行、凭据收集或通用攻击工具。
`;
}

function createVerifyScript(scenario) {
  return `import { runGuidedScenarioVerification } from "../../guided-scenario-verifier.mjs";

await runGuidedScenarioVerification("${scenario.id}");
`;
}

function createExploitScript(scenario) {
  return `"""${scenario.title}本机固定案例受控请求脚本。"""

import argparse
import json
from urllib.parse import urlparse
from urllib.request import Request, urlopen


def validate_target(target: str) -> str:
    parsed = urlparse(target)
    if parsed.scheme != "http" or parsed.hostname not in {"localhost", "127.0.0.1"}:
        raise ValueError("目标必须是 http://localhost 或 http://127.0.0.1")
    return target.rstrip("/")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", default="http://127.0.0.1:6667")
    parser.add_argument("--token", required=True, help="本机演示账号的临时 Bearer token")
    parser.add_argument("--variant", choices=["vuln", "fixed"], default="vuln")
    parser.add_argument(
        "--control-key",
        choices=["${scenario.controls[0].key}", "${scenario.controls[1].key}"],
        default="${scenario.controls[0].key}",
    )
    args = parser.parse_args()

    target = validate_target(args.target)
    endpoint = f"{target}/api/labs/${scenario.category}/${scenario.subcategory}/{args.variant}/evaluate"
    payload = json.dumps(
        {
            "scenarioKey": "${scenario.defaultScenarioKey}",
            "controlKey": args.control_key,
        }
    ).encode("utf-8")
    request = Request(
        endpoint,
        data=payload,
        headers={
            "authorization": f"Bearer {args.token}",
            "content-type": "application/json",
        },
        method="POST",
    )

    # 仅发送共享目录中定义的固定 key，不接受任意请求体或外部目标。
    with urlopen(request, timeout=5) as response:
        print(response.read().decode("utf-8"))


if __name__ == "__main__":
    main()
`;
}

const summary = {
  executionDocs: 0,
  assets: 0,
};

for (const [index, scenario] of guidedScenarioCatalog.entries()) {
  writeGenerated(executionDocPath(scenario), createExecutionDoc(scenario));
  summary.executionDocs += 1;

  if (docsOnly) {
    continue;
  }

  const labRoot = `labs/${scenario.category}/${scenario.subcategory}`;
  const scriptsRoot = `tools/lab-scripts/${scenario.category}/${scenario.subcategory}`;
  const generatedFiles = [
    [`${labRoot}/meta.json`, JSON.stringify(createMetadata(scenario, index), null, 2)],
    [`${labRoot}/README.md`, createReadme(scenario)],
    [`${labRoot}/vuln/README.md`, createVariantReadme(scenario, "vuln")],
    [`${labRoot}/fixed/README.md`, createVariantReadme(scenario, "fixed")],
    [`${labRoot}/mock/README.md`, createMockReadme(scenario)],
    [`${labRoot}/docs/attack-steps.md`, createAttackSteps(scenario)],
    [`${labRoot}/docs/fix-notes.md`, createFixNotes(scenario)],
    [`${labRoot}/docs/manual-verification.md`, createManualVerification(scenario)],
    [`${scriptsRoot}/README.md`, createScriptReadme(scenario)],
    [`${scriptsRoot}/verify.ts`, createVerifyScript(scenario)],
  ];

  if (scenario.mode === "interactive") {
    generatedFiles.push([
      `${scriptsRoot}/exploit.py`,
      createExploitScript(scenario),
    ]);
  }

  for (const [relativePath, content] of generatedFiles) {
    writeGenerated(relativePath, content);
    summary.assets += 1;
  }
}

console.log(JSON.stringify({ docsOnly, ...summary }, null, 2));
