import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  parseLabMetadataJson,
  validateLabMetadata,
} from "../../packages/shared/src/lab-metadata.js";
import type { ControlledDecisionLabService } from "../../apps/server/src/services/controlled-decision-lab.js";

export type ControlledVerificationConfig = {
  repositoryRoot: string;
  labId: string;
  category: string;
  scene: string;
  mode: "interactive" | "simulation" | "case-study";
  scenarioKey: string;
  riskPath: string[];
  defensePath: string[];
  normalPath: string[];
  signals: { risk: string; defense: string; normal: string; boundary: string };
  service: ControlledDecisionLabService;
  scriptPath: string;
};

export function runControlledDecisionConsistencyVerification(
  config: ControlledVerificationConfig,
) {
  const checks: Array<{ key: string; passed: boolean; message: string }> = [];
  const metadataPath = `labs/${config.category}/${config.scene}/meta.json`;
  const absoluteMetadataPath = path.join(config.repositoryRoot, metadataPath);
  const parsed = parseLabMetadataJson(readFileSync(absoluteMetadataPath, "utf8"));
  checks.push({ key: "metadata-json", passed: parsed.ok, message: parsed.ok ? "元数据 JSON 可解析。" : parsed.errors.join("; ") });

  if (!parsed.ok) {
    return { labKey: config.labId, scope: "local-repository-only", ok: false, checkedFiles: [metadataPath], checks, notes: ["元数据解析失败。"] };
  }

  const validation = validateLabMetadata(parsed.value);
  checks.push({ key: "metadata-schema", passed: validation.ok, message: validation.ok ? "元数据符合共享 schema。" : validation.errors.join("; ") });
  if (!validation.ok) {
    return { labKey: config.labId, scope: "local-repository-only", ok: false, checkedFiles: [metadataPath], checks, notes: ["元数据 schema 校验失败。"] };
  }

  const metadata = validation.value;
  const expectedFiles = [
    metadataPath,
    `labs/${config.category}/${config.scene}/README.md`,
    `labs/${config.category}/${config.scene}/vuln/README.md`,
    `labs/${config.category}/${config.scene}/fixed/README.md`,
    `labs/${config.category}/${config.scene}/mock/README.md`,
    `labs/${config.category}/${config.scene}/docs/attack-steps.md`,
    `labs/${config.category}/${config.scene}/docs/fix-notes.md`,
    `labs/${config.category}/${config.scene}/docs/manual-verification.md`,
    config.scriptPath,
  ];
  const risk = config.service.evaluate({ variantKey: "vuln", scenarioKey: config.scenarioKey, decisions: config.riskPath });
  const defense = config.service.evaluate({ variantKey: "fixed", scenarioKey: config.scenarioKey, decisions: config.defensePath });
  const normal = config.service.evaluate({ variantKey: "fixed", scenarioKey: config.scenarioKey, decisions: config.normalPath });
  const rawUnknown = "raw-external-secret-or-target";
  const unknown = config.service.evaluate({ variantKey: "vuln", scenarioKey: rawUnknown, decisions: config.riskPath });

  checks.push(
    { key: "metadata-state", passed: metadata.id === config.labId && metadata.mode === config.mode && (metadata.status === "in-progress" || metadata.status === "ready"), message: "实验 ID、模式应准确，验证前保持 in-progress，收口后推进 ready。" },
    { key: "web-entrypoints", passed: metadata.entrypoints.web.length === 2, message: "应登记两个 Web 变体入口。" },
    { key: "api-entrypoints", passed: metadata.entrypoints.api.length === 3, message: "应登记工作台和两个评估 API。" },
    { key: "script-entrypoint", passed: metadata.entrypoints.scripts.some((entry) => entry.path === config.scriptPath), message: "应登记独立只读验证脚本。" },
    { key: "signals", passed: JSON.stringify(metadata.verification.manual.expectedSignals) === JSON.stringify([config.signals.risk, config.signals.defense, config.signals.normal]), message: "三个 canonical 信号应保持顺序一致。" },
    { key: "risk-path", passed: risk.signal === config.signals.risk && risk.decision === "accepted", message: "风险路径应返回风险接受信号。" },
    { key: "defense-path", passed: defense.signal === config.signals.defense && defense.decision === "blocked", message: "防御路径应返回阻断信号。" },
    { key: "normal-path", passed: normal.signal === config.signals.normal && normal.decision === "accepted", message: "正常路径应保持可用。" },
    { key: "unknown-input", passed: unknown.signal === config.signals.boundary && !JSON.stringify(unknown).includes(rawUnknown), message: "未知输入应脱敏阻断。" },
    { key: "files", passed: expectedFiles.every((file) => existsSync(path.join(config.repositoryRoot, file))), message: "标准文档和验证入口应全部存在。" },
    { key: "case-study-automation", passed: config.mode !== "case-study" || metadata.variants.every((variant) => variant.supportsAutomation === false), message: "case-study 变体不得声明攻击脚本自动化。" },
    { key: "no-exploit", passed: config.mode !== "case-study" || !existsSync(path.join(config.repositoryRoot, `tools/lab-scripts/${config.category}/${config.scene}/exploit.py`)), message: "case-study 不应提供 exploit.py。" },
  );

  return {
    labKey: config.labId,
    scope: "local-repository-only",
    ok: checks.every((check) => check.passed),
    checkedFiles: expectedFiles,
    checks,
    notes: ["只读取仓库固定数据，不连接外部目标、真实账户、主机、日志或凭据。"],
  };
}
