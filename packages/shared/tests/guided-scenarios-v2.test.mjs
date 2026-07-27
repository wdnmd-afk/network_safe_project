import assert from "node:assert/strict";
import test from "node:test";

import {
  createGuidedScenarioMachine,
  liftV1Scenario,
  validateGuidedScenarioV2,
} from "../src/guided-scenarios-v2.js";
import { guidedScenarioCatalog } from "../src/guided-scenarios.js";

// 一个多步骤、多结果的最小合法定义，用于覆盖 schema 与状态机的核心路径。
function buildValidDefinition() {
  return {
    version: 2,
    id: "web.clickjacking",
    slug: "clickjacking",
    category: "web",
    subcategory: "clickjacking",
    title: "点击劫持第二版",
    mode: "interactive",
    severity: "medium",
    difficulty: "beginner",
    summary: "固定多步骤点击劫持案例。",
    phase: "phase-1",
    tags: ["web", "clickjacking"],
    knowledgePoints: ["框架嵌入边界", "用户意图确认"],
    scoringDimensions: [
      { key: "risk-awareness", title: "风险识别", description: "识别嵌入风险。", max: 2 },
      { key: "defense-alignment", title: "防御落实", description: "落实防嵌入策略。", max: 1 },
    ],
    defaultCaseKey: "embedded-approval-overlay",
    cases: [
      {
        key: "embedded-approval-overlay",
        title: "透明覆盖审批按钮",
        description: "固定案例展示敏感审批按钮被透明层诱导点击。",
        assets: [
          { key: "approval-page", kind: "asset", title: "审批页面", detail: "固定虚构审批页面。" },
        ],
        timeline: [
          { key: "embed-detected", kind: "timeline", title: "检测到嵌入", detail: "页面被第三方 iframe 嵌入。" },
        ],
        evidence: [
          { key: "overlay-present", kind: "evidence", title: "透明覆盖层", detail: "存在透明覆盖层。" },
        ],
        initialStepKey: "triage",
        steps: [
          {
            key: "triage",
            order: 1,
            title: "研判嵌入风险",
            prompt: "如何处理这次嵌入审批请求?",
            riskSignal: "web-clickjacking-triage",
            options: [
              {
                key: "accept-embed",
                label: "直接批准（漏洞视角）",
                outcome: "risk",
                decision: "accepted",
                signal: "web-clickjacking-risk-accepted",
                explanation: "未校验嵌入来源即批准，接受了高风险动作。",
                nextStepKey: null,
                scoreDeltas: { "risk-awareness": 0 },
              },
              {
                key: "inspect-frame",
                label: "先检查框架策略",
                outcome: "fix",
                decision: "blocked",
                signal: "web-clickjacking-frame-checked",
                explanation: "识别到缺少 frame-ancestors，进入防御步骤。",
                nextStepKey: "enforce",
                scoreDeltas: { "risk-awareness": 1 },
              },
            ],
          },
          {
            key: "enforce",
            order: 2,
            title: "落实防嵌入策略",
            prompt: "选择防御落实方式。",
            riskSignal: "web-clickjacking-enforce",
            options: [
              {
                key: "enforce-frame-policy",
                label: "启用 frame-ancestors 与二次确认",
                outcome: "normal",
                decision: "accepted",
                signal: "web-clickjacking-defense-verified",
                explanation: "防嵌入策略落实后，正常审批流程可以继续。",
                nextStepKey: null,
                scoreDeltas: { "defense-alignment": 1 },
              },
            ],
          },
        ],
      },
    ],
    safeBoundaries: [
      "只处理固定本机 Web 教学场景，不生成外部攻击载荷。",
      "页面和 API 只接受共享目录中声明的 key。",
      "未知 key 会被脱敏阻断。",
    ],
    notes: "第二版设计骨架，不接入运行时。",
  };
}

test("validateGuidedScenarioV2 accepts a well-formed multi-step definition", () => {
  const result = validateGuidedScenarioV2(buildValidDefinition());

  assert.equal(result.ok, true);
});

test("validateGuidedScenarioV2 rejects wrong version and mismatched id", () => {
  const bad = buildValidDefinition();
  bad.version = 1;
  bad.id = "web.wrong";

  const result = validateGuidedScenarioV2(bad);

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("version")));
  assert.ok(result.errors.some((error) => error.includes("id must equal")));
});

test("validateGuidedScenarioV2 rejects option pointing to unknown step", () => {
  const bad = buildValidDefinition();
  bad.cases[0].steps[0].options[1].nextStepKey = "does-not-exist";

  const result = validateGuidedScenarioV2(bad);

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("unknown step")));
});

test("validateGuidedScenarioV2 rejects a cyclic step graph", () => {
  const bad = buildValidDefinition();
  // enforce 指回 triage 形成环，且没有任何终止选项。
  bad.cases[0].steps[0].options[0].nextStepKey = "enforce";
  bad.cases[0].steps[0].options[1].nextStepKey = "enforce";
  bad.cases[0].steps[1].options[0].nextStepKey = "triage";

  const result = validateGuidedScenarioV2(bad);

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("cycle")));
});

test("validateGuidedScenarioV2 rejects scoreDeltas on unknown dimension", () => {
  const bad = buildValidDefinition();
  bad.cases[0].steps[0].options[0].scoreDeltas = { "unknown-dimension": 1 };

  const result = validateGuidedScenarioV2(bad);

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("unknown dimension")));
});

test("state machine walks a fixed multi-step path and records a safe recap", () => {
  const machine = createGuidedScenarioMachine(buildValidDefinition());

  assert.equal(machine.currentStepKey, "triage");
  assert.deepEqual(
    machine.availableOptions().map((option) => option.key),
    ["accept-embed", "inspect-frame"],
  );

  const first = machine.choose("inspect-frame");
  assert.equal(first.status, "ok");
  assert.equal(first.outcome, "fix");
  assert.equal(first.completed, false);
  assert.equal(machine.currentStepKey, "enforce");

  const second = machine.choose("enforce-frame-policy");
  assert.equal(second.status, "ok");
  assert.equal(second.outcome, "normal");
  assert.equal(second.completed, true);
  assert.equal(machine.isCompleted, true);
  assert.equal(machine.currentStepKey, null);

  const recap = machine.recap();
  assert.equal(recap.completed, true);
  assert.equal(recap.terminalOutcome, "normal");
  assert.deepEqual(recap.outcomeCounts, { risk: 0, fix: 1, normal: 1 });
  assert.deepEqual(recap.scores, { "risk-awareness": 1, "defense-alignment": 1 });
  assert.deepEqual(
    recap.path.map((entry) => entry.optionKey),
    ["inspect-frame", "enforce-frame-policy"],
  );
});

test("state machine blocks unknown option without advancing or echoing input", () => {
  const machine = createGuidedScenarioMachine(buildValidDefinition());

  const blocked = machine.choose("<script>alert(1)</script>");

  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.reason, "option-not-allowed");
  assert.equal(blocked.signal, "guided-v2-option-blocked");
  assert.equal(machine.currentStepKey, "triage");
  // 阻断结果只包含固定 key 和信号，不回显原始输入。
  assert.equal(JSON.stringify(blocked).includes("script"), false);
});

test("state machine supports back and reset", () => {
  const machine = createGuidedScenarioMachine(buildValidDefinition());

  machine.choose("inspect-frame");
  assert.equal(machine.currentStepKey, "enforce");

  const back = machine.back();
  assert.equal(back.status, "ok");
  assert.equal(machine.currentStepKey, "triage");
  assert.deepEqual(machine.recap().scores, {
    "risk-awareness": 0,
    "defense-alignment": 0,
  });

  machine.choose("accept-embed");
  assert.equal(machine.isCompleted, true);
  machine.reset();
  assert.equal(machine.isCompleted, false);
  assert.equal(machine.currentStepKey, "triage");
});

test("choosing after completion is blocked", () => {
  const machine = createGuidedScenarioMachine(buildValidDefinition());

  machine.choose("accept-embed");
  assert.equal(machine.isCompleted, true);

  const blocked = machine.choose("inspect-frame");
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.reason, "machine-completed");
});

test("liftV1Scenario expresses every existing guided scenario as a valid v2 definition", () => {
  assert.ok(guidedScenarioCatalog.length > 0);

  for (const v1 of guidedScenarioCatalog) {
    const lifted = liftV1Scenario(v1);
    const result = validateGuidedScenarioV2(lifted);

    assert.equal(result.ok, true, `${v1.id} should lift to a valid v2 definition`);

    const machine = createGuidedScenarioMachine(lifted);
    const risk = machine.choose("accept-risk");
    assert.equal(risk.signal, v1.vulnerableOutcome.signal, v1.id);
    assert.equal(machine.isCompleted, true, v1.id);
  }
});

test("liftV1Scenario preserves fixed control signals in the normal path", () => {
  const sample = guidedScenarioCatalog.find(
    (scenario) => scenario.id === "social.smishing",
  );
  const lifted = liftV1Scenario(sample);
  const machine = createGuidedScenarioMachine(lifted);

  const normal = machine.choose(sample.controls[1].key);
  assert.equal(normal.outcome, "normal");
  assert.equal(normal.signal, sample.controls[1].fixedSignal);
  assert.equal(normal.decision, "accepted");
});
