import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type RateLimitIdempotencyVariantKey = "vuln" | "fixed";

export const rateLimitIdempotencyScenarioKey =
  "fixed-webhook-batch-quota-audit";
export const rateLimitIdempotencyRiskSignal =
  "api-rate-limit-idempotency-risk-accepted";
export const rateLimitIdempotencyDefenseSignal =
  "api-rate-limit-idempotency-defense-blocked";
export const rateLimitIdempotencyNormalSignal =
  "api-rate-limit-idempotency-normal-verified";
export const rateLimitIdempotencyBoundarySignal =
  "api-rate-limit-idempotency-boundary-blocked";

export type FixedWebhookBatchSnapshot = {
  readonly batchKey: string;
  readonly displayName: string;
  readonly quotaScope: "unlimited" | "windowed-quota";
  readonly idempotencyScope: "none" | "idempotency-key-required";
  readonly timestampScope: "none" | "signed-window";
  readonly degradeScope: "none" | "throttle-then-degrade";
  readonly replayProcessedTwice: boolean;
  readonly expectedPosture: "vulnerable" | "hardened";
  readonly findings: readonly string[];
};

export type WebhookBatchAssessment = {
  batchKey: string;
  expectedPosture: FixedWebhookBatchSnapshot["expectedPosture"];
  findingCount: number;
  criticalFindingCount: number;
  resourceControlCount: number;
};

// 固定批次快照只使用虚构标识，不包含真实端点、签名密钥或租户标识
export const fixedWebhookBatchSnapshots: readonly FixedWebhookBatchSnapshot[] =
  Object.freeze([
    Object.freeze({
      batchKey: "virtual-unthrottled-replayable-batch",
      displayName: "虚构无配额可重放批次（风险基线）",
      quotaScope: "unlimited",
      idempotencyScope: "none",
      timestampScope: "none",
      degradeScope: "none",
      replayProcessedTwice: true,
      expectedPosture: "vulnerable",
      findings: Object.freeze([
        "固定时间窗内没有配额上限，超额批次被全量接受。",
        "缺少幂等键校验，重复事件被重复处理。",
        "缺少签名时间戳窗口，陈旧事件仍可被接受。",
        "缺少节流与降级策略，过载时没有可用的兜底路径。",
      ]),
    }),
    Object.freeze({
      batchKey: "virtual-quota-idempotent-batch",
      displayName: "虚构配额幂等批次（加固基线）",
      quotaScope: "windowed-quota",
      idempotencyScope: "idempotency-key-required",
      timestampScope: "signed-window",
      degradeScope: "throttle-then-degrade",
      replayProcessedTwice: false,
      expectedPosture: "hardened",
      findings: Object.freeze([]),
    }),
  ]);

export function assessFixedWebhookBatch(
  batch: FixedWebhookBatchSnapshot,
): WebhookBatchAssessment {
  const unlimitedQuota = batch.quotaScope === "unlimited";
  const missingDegrade = batch.degradeScope === "none";

  return {
    batchKey: batch.batchKey,
    expectedPosture: batch.expectedPosture,
    findingCount: batch.findings.length,
    // 关键风险只统计"无配额且无降级"与"重复事件被重复处理"这两类组合
    criticalFindingCount:
      Number(unlimitedQuota && missingDegrade) +
      Number(batch.replayProcessedTwice),
    resourceControlCount:
      Number(batch.quotaScope === "windowed-quota") +
      Number(batch.idempotencyScope === "idempotency-key-required") +
      Number(batch.timestampScope === "signed-window") +
      Number(batch.degradeScope === "throttle-then-degrade"),
  };
}

const batchKeyByAssessmentOption = {
  "accept-unthrottled-replayable-batch": "virtual-unthrottled-replayable-batch",
  "enforce-quota-and-idempotency": "virtual-quota-idempotent-batch",
} as const;

const batchDecisions = {
  "approve-overload-and-replay": {
    actionKey: "approve-overload-and-replay",
    disposition: "overload-and-replay-approved",
    summary:
      "超额批次与重复事件在无配额、无幂等键的固定路径下被全量接受，资源耗尽与重复副作用未被阻断。",
    nextAction: "切换到修复路径，复盘配额、幂等键、时间戳窗口与降级的组合作用。",
  },
  "block-overload-and-replay": {
    actionKey: "block-overload-and-replay",
    disposition: "overload-and-replay-blocked",
    summary:
      "固定基线按时间窗配额拒绝超额批次，并按幂等键与签名时间戳窗口丢弃重复与陈旧事件。",
    nextAction: "核对四项资源与重放控制均已登记，不发起任何真实并发请求。",
  },
  "verify-throttled-baseline": {
    actionKey: "verify-throttled-baseline",
    disposition: "throttled-baseline-verified",
    summary:
      "配额内的固定正常批次在节流与降级策略下仍被正确处理，且每个事件只处理一次。",
    nextAction: "在事件日志中确认只保留固定批次 key、计数与学习信号。",
  },
} as const;

type AssessmentOptionKey = keyof typeof batchKeyByAssessmentOption;
type BatchDecisionKey = keyof typeof batchDecisions;

const rateLimitIdempotencyDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "api.rate-limit-idempotency",
  slug: "rate-limit-idempotency",
  category: "api",
  subcategory: "rate-limit-idempotency",
  title: "API 配额与 Webhook 重放幂等固定审计",
  mode: "simulation",
  severity: "high",
  difficulty: "intermediate",
  summary:
    "通过两份虚构 Webhook 批次快照，对比无配额可重放路径与施加配额、幂等键、时间戳窗口后的审计结果。",
  phase: "phase-1",
  tags: ["api", "rate-limiting", "idempotency", "webhook-replay"],
  knowledgePoints: ["时间窗配额", "幂等键去重", "签名时间戳窗口", "节流与降级"],
  scoringDimensions: [
    {
      key: "batch-assessment",
      title: "批次范围评估",
      description: "识别配额、幂等键、时间戳与降级四项控制的组合风险。",
      max: 1,
    },
    {
      key: "batch-decision",
      title: "过载与重放处置",
      description: "阻断超额批次与重复事件，并确认配额内正常基线。",
      max: 1,
    },
  ],
  defaultCaseKey: rateLimitIdempotencyScenarioKey,
  cases: [
    {
      key: rateLimitIdempotencyScenarioKey,
      title: "固定 Webhook 批次配额审计",
      description:
        "对比一份无配额可重放批次和一份配额幂等批次，不发起任何真实并发请求。",
      assets: [
        {
          key: "fixed-batch-snapshots",
          kind: "asset",
          title: "虚构批次快照",
          detail:
            "只登记 virtual-* 标识与四项控制的语义枚举，不含真实端点或签名密钥。",
        },
        {
          key: "fixed-quota-baseline",
          kind: "policy",
          title: "固定配额幂等基线",
          detail:
            "要求时间窗配额、幂等键去重、签名时间戳窗口和节流降级四项同时成立。",
        },
      ],
      evidence: [
        {
          key: "unthrottled-replay-combination",
          kind: "evidence",
          title: "无配额可重放组合",
          detail:
            "固定风险批次同时缺少配额、幂等键、时间戳窗口与降级，且重复事件被处理两次。",
        },
        {
          key: "quota-idempotent-baseline",
          kind: "evidence",
          title: "配额幂等基线",
          detail: "固定加固批次登记四项资源控制，且重复事件只被处理一次。",
        },
      ],
      initialStepKey: "webhook-batch-scope-assessment",
      steps: [
        {
          key: "webhook-batch-scope-assessment",
          order: 1,
          title: "批次范围评估",
          prompt: "选择对固定虚构 Webhook 批次的审计策略。",
          riskSignal: "api-rate-limit-idempotency-assessment",
          options: [
            {
              key: "accept-unthrottled-replayable-batch",
              label: "接受无配额、无幂等键的可重放批次（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "api-rate-limit-idempotency-unthrottled-accepted",
              explanation:
                "漏洞路径忽略配额缺失与幂等键缺失叠加造成的资源耗尽和重复副作用。",
              nextStepKey: "webhook-batch-decision",
              scoreDeltas: { "batch-assessment": 0 },
            },
            {
              key: "enforce-quota-and-idempotency",
              label: "施加时间窗配额、幂等键与签名时间戳窗口",
              outcome: "fix",
              decision: "blocked",
              signal: "api-rate-limit-idempotency-controls-enforced",
              explanation:
                "修复路径要求配额、幂等键、时间戳窗口和节流降级四项同时成立。",
              nextStepKey: "webhook-batch-decision",
              scoreDeltas: { "batch-assessment": 1 },
            },
          ],
        },
        {
          key: "webhook-batch-decision",
          order: 2,
          title: "过载与重放处置",
          prompt: "根据固定审计摘要选择过载与重放处置结论。",
          riskSignal: "api-rate-limit-idempotency-decision",
          options: [
            {
              key: "approve-overload-and-replay",
              label: "批准超额批次与重复事件继续处理（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: rateLimitIdempotencyRiskSignal,
              explanation:
                "漏洞版批准固定超额批次与重复事件，使资源耗尽与重复副作用继续存在。",
              nextStepKey: null,
              scoreDeltas: { "batch-decision": 0 },
            },
            {
              key: "block-overload-and-replay",
              label: "阻断超额批次与重复事件",
              outcome: "fix",
              decision: "blocked",
              signal: rateLimitIdempotencyDefenseSignal,
              explanation:
                "修复版按固定配额与幂等键阻断超额和重放路径，不发起任何真实并发请求。",
              nextStepKey: null,
              scoreDeltas: { "batch-decision": 1 },
            },
            {
              key: "verify-throttled-baseline",
              label: "验证配额内正常批次基线",
              outcome: "normal",
              decision: "accepted",
              signal: rateLimitIdempotencyNormalSignal,
              explanation:
                "修复版确认配额内固定正常批次在节流降级下仍可处理，且每个事件只处理一次。",
              nextStepKey: null,
              scoreDeltas: { "batch-decision": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用两份冻结的虚构 Webhook 批次快照，不连接真实 Webhook 提供方、队列或外部端点。",
    "标识固定使用 virtual-* 前缀，四项控制只使用语义枚举，不含真实签名密钥、端点或租户标识。",
    "页面和 API 只接受已登记 scenarioKey 与 optionKey，未知输入会被脱敏阻断。",
    "不发起真实并发请求，不实现请求泛洪器，也不提供任何重放工具。",
  ],
  notes:
    "该实验仅生成固定批次审计与学习摘要，不发起真实并发请求，也不提供重放载荷或 exploit.py。",
};

export type RateLimitIdempotencyWorkbench = {
  id: string;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  mode: GuidedScenarioV2Definition["mode"];
  severity: GuidedScenarioV2Definition["severity"];
  difficulty: GuidedScenarioV2Definition["difficulty"];
  summary: string;
  defaultScenarioKey: string;
  scoringDimensions: GuidedScenarioV2Definition["scoringDimensions"];
  cases: GuidedScenarioV2Definition["cases"];
  safeBoundaries: string[];
  notes: string;
  // 固定批次是冻结的教学数据，工作台只返回只读副本
  batchSnapshots: readonly FixedWebhookBatchSnapshot[];
  batchAssessments: WebhookBatchAssessment[];
};

export type RateLimitIdempotencyStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type WebhookBatchDecision =
  (typeof batchDecisions)[BatchDecisionKey];

export type RateLimitIdempotencyEvaluationInput = {
  variantKey: RateLimitIdempotencyVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type RateLimitIdempotencyEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: RateLimitIdempotencyVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: RateLimitIdempotencyStepResult[];
  batchAssessment: WebhookBatchAssessment | null;
  batchDecision: WebhookBatchDecision | null;
  recap: {
    outcomeCounts: Record<"risk" | "fix" | "normal", number>;
    scores: Record<string, number>;
    terminalOutcome: "risk" | "fix" | "normal" | null;
  };
  assessment: {
    riskLevel: GuidedScenarioV2Definition["severity"];
    stepCount: number;
    matchedScenario: boolean;
  };
  blockedReason?: string;
};

export type RateLimitIdempotencyLabService = {
  getWorkbench(): RateLimitIdempotencyWorkbench;
  evaluate(
    input: RateLimitIdempotencyEvaluationInput,
  ): RateLimitIdempotencyEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: RateLimitIdempotencyVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): RateLimitIdempotencyEvaluationResult {
  return {
    status: "blocked",
    labKey: rateLimitIdempotencyDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? rateLimitIdempotencyScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: rateLimitIdempotencyBoundarySignal,
    message: "请求中的固定案例或决策未登记，服务未处理也未回显原始输入。",
    nextStep: "只选择工作台返回的固定 scenarioKey 与决策选项。",
    completed: false,
    steps: [],
    batchAssessment: null,
    batchDecision: null,
    recap: {
      outcomeCounts: { risk: 0, fix: 0, normal: 0 },
      scores: {},
      terminalOutcome: null,
    },
    assessment: {
      riskLevel: rateLimitIdempotencyDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: RateLimitIdempotencyVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版，对比配额、幂等键、时间戳窗口和降级四项控制如何改变审计结论。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘超额与重放阻断结果后，再验证配额内固定正常批次基线。";
  }

  return "在事件日志中确认只记录固定批次 key、审计计数、终止结果和学习信号。";
}

function findBatch(batchKey: string) {
  return fixedWebhookBatchSnapshots.find(
    (batch) => batch.batchKey === batchKey,
  );
}

export function createRateLimitIdempotencyLabService(): RateLimitIdempotencyLabService {
  const batchAssessments = fixedWebhookBatchSnapshots.map(
    assessFixedWebhookBatch,
  );

  return {
    getWorkbench() {
      return {
        id: rateLimitIdempotencyDefinition.id,
        slug: rateLimitIdempotencyDefinition.slug,
        category: rateLimitIdempotencyDefinition.category,
        subcategory: rateLimitIdempotencyDefinition.subcategory,
        title: rateLimitIdempotencyDefinition.title,
        mode: rateLimitIdempotencyDefinition.mode,
        severity: rateLimitIdempotencyDefinition.severity,
        difficulty: rateLimitIdempotencyDefinition.difficulty,
        summary: rateLimitIdempotencyDefinition.summary,
        defaultScenarioKey: rateLimitIdempotencyDefinition.defaultCaseKey,
        scoringDimensions: rateLimitIdempotencyDefinition.scoringDimensions,
        cases: rateLimitIdempotencyDefinition.cases,
        safeBoundaries: [...rateLimitIdempotencyDefinition.safeBoundaries],
        notes: rateLimitIdempotencyDefinition.notes,
        batchSnapshots: structuredClone(fixedWebhookBatchSnapshots),
        batchAssessments: structuredClone(batchAssessments),
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== rateLimitIdempotencyScenarioKey) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: false,
          blockedReason: "scenario-not-allowed",
        });
      }

      if (!Array.isArray(input.decisions) || input.decisions.length === 0) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "decisions-required",
        });
      }

      const machine = createGuidedScenarioMachine(
        rateLimitIdempotencyDefinition,
        rateLimitIdempotencyScenarioKey,
      );
      const steps: RateLimitIdempotencyStepResult[] = [];

      for (const optionKey of input.decisions) {
        const step = machine.choose(optionKey);

        if (step.status === "blocked") {
          return createBlockedResult({
            variantKey: input.variantKey,
            matchedScenario: true,
            blockedReason: step.reason,
          });
        }

        steps.push({
          stepKey: step.stepKey,
          optionKey,
          outcome: step.outcome,
          decision: step.decision,
          signal: step.signal,
          explanation: step.explanation,
        });

        if (step.completed) {
          break;
        }
      }

      // 终止步骤之后追加的多余决策一律阻断，避免路径被拼接
      if (steps.length !== input.decisions.length) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "decisions-after-terminal",
        });
      }

      const recap = machine.recap();

      if (!recap.completed) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "path-incomplete",
        });
      }

      const terminal = steps[steps.length - 1];
      const batchKey =
        batchKeyByAssessmentOption[steps[0].optionKey as AssessmentOptionKey];
      const batch = batchKey ? findBatch(batchKey) : undefined;
      const batchDecision =
        batchDecisions[terminal.optionKey as BatchDecisionKey];

      if (!batch || !batchDecision) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "registered-summary-missing",
        });
      }

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: rateLimitIdempotencyDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: rateLimitIdempotencyScenarioKey,
        decision: terminal.decision,
        signal: terminal.signal,
        message: terminal.explanation,
        nextStep: buildNextStep({
          variantKey: input.variantKey,
          terminalOutcome: recap.terminalOutcome,
        }),
        completed: true,
        steps,
        batchAssessment: assessFixedWebhookBatch(batch),
        batchDecision,
        recap: {
          outcomeCounts: recap.outcomeCounts,
          scores: recap.scores,
          terminalOutcome: recap.terminalOutcome,
        },
        assessment: {
          riskLevel: rateLimitIdempotencyDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "overload-and-replay-blocked" }
          : {}),
      };
    },
  };
}
