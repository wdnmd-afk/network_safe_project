import {
  createGuidedScenarioMachine,
  type GuidedScenarioV2Definition,
} from "@network-safe/shared/guided-scenarios-v2";

export type MitbTransactionVariantKey = "vuln" | "fixed";

export const mitbTransactionScenarioKey =
  "fixed-browser-transaction-view-audit";
export const mitbTransactionRiskSignal = "client-mitb-risk-accepted";
export const mitbTransactionDefenseSignal = "client-mitb-defense-blocked";
export const mitbTransactionNormalSignal = "client-mitb-normal-verified";
export const mitbTransactionBoundarySignal = "client-mitb-boundary-blocked";

export type FixedTransactionView = {
  readonly viewKey: string;
  readonly displayName: string;
  readonly browserPayee: string;
  readonly browserAmount: string;
  readonly serverPayee: string;
  readonly serverAmount: string;
  readonly outOfBandPayee: string;
  readonly outOfBandAmount: string;
  readonly transactionSigned: boolean;
  readonly expectedPosture: "tampered" | "consistent";
  readonly findings: readonly string[];
};

export type TransactionViewAssessment = {
  viewKey: string;
  expectedPosture: FixedTransactionView["expectedPosture"];
  findingCount: number;
  mismatchCount: number;
  trustedPathControlCount: number;
};

// 固定交易视图只使用 virtual-* 收款方与教学金额，不含真实账户、卡号或支付指令
export const fixedTransactionViews: readonly FixedTransactionView[] =
  Object.freeze([
    Object.freeze({
      viewKey: "virtual-tampered-transfer-view",
      displayName: "虚构转账视图（篡改基线）",
      browserPayee: "virtual-supplier-a",
      browserAmount: "1000.00",
      serverPayee: "virtual-unknown-payee-z",
      serverAmount: "9500.00",
      outOfBandPayee: "virtual-unknown-payee-z",
      outOfBandAmount: "9500.00",
      transactionSigned: false,
      expectedPosture: "tampered",
      findings: Object.freeze([
        "浏览器显示的收款方与服务端记录不一致。",
        "浏览器显示的金额与服务端记录不一致。",
        "带外确认通道与浏览器显示同样不一致。",
        "交易缺少独立签名，无法证明用户确认了服务端记录的内容。",
      ]),
    }),
    Object.freeze({
      viewKey: "virtual-consistent-transfer-view",
      displayName: "虚构转账视图（一致基线）",
      browserPayee: "virtual-supplier-a",
      browserAmount: "1000.00",
      serverPayee: "virtual-supplier-a",
      serverAmount: "1000.00",
      outOfBandPayee: "virtual-supplier-a",
      outOfBandAmount: "1000.00",
      transactionSigned: true,
      expectedPosture: "consistent",
      findings: Object.freeze([]),
    }),
  ]);

export function assessFixedTransactionView(
  view: FixedTransactionView,
): TransactionViewAssessment {
  const payeeMismatch = view.browserPayee !== view.serverPayee;
  const amountMismatch = view.browserAmount !== view.serverAmount;
  const outOfBandMismatch =
    view.browserPayee !== view.outOfBandPayee ||
    view.browserAmount !== view.outOfBandAmount;

  return {
    viewKey: view.viewKey,
    expectedPosture: view.expectedPosture,
    findingCount: view.findings.length,
    // 不一致计数覆盖收款方、金额和带外通道三个对照维度
    mismatchCount:
      Number(payeeMismatch) + Number(amountMismatch) + Number(outOfBandMismatch),
    trustedPathControlCount:
      Number(!payeeMismatch) +
      Number(!amountMismatch) +
      Number(!outOfBandMismatch) +
      Number(view.transactionSigned),
  };
}

const viewKeyByAssessmentOption = {
  "trust-browser-rendered-view": "virtual-tampered-transfer-view",
  "compare-server-and-out-of-band-view": "virtual-consistent-transfer-view",
} as const;

const transactionDecisions = {
  "submit-transaction-from-browser-view": {
    actionKey: "submit-transaction-from-browser-view",
    disposition: "tampered-transaction-submitted",
    summary:
      "仅凭浏览器显示提交交易，服务端记录与带外通道的不一致未被发现。",
    nextAction: "切换到防御路径，复盘三方对照与交易签名如何暴露视图篡改。",
  },
  "block-mismatched-transaction": {
    actionKey: "block-mismatched-transaction",
    disposition: "mismatched-transaction-blocked",
    summary:
      "固定策略阻断三方视图不一致且未签名的交易，并要求受信路径重新确认。",
    nextAction: "核对四项受信路径控制，不执行任何真实支付或撤销操作。",
  },
  "confirm-consistent-transaction": {
    actionKey: "confirm-consistent-transaction",
    disposition: "consistent-transaction-confirmed",
    summary:
      "三方视图一致且交易已签名的固定基线通过确认，正常业务流程未被阻断。",
    nextAction: "在事件日志中确认只保留固定视图 key、计数与学习信号。",
  },
} as const;

type AssessmentOptionKey = keyof typeof viewKeyByAssessmentOption;
type TransactionDecisionKey = keyof typeof transactionDecisions;

const mitbTransactionDefinition: GuidedScenarioV2Definition = {
  version: 2,
  id: "client.mitb",
  slug: "mitb",
  category: "client",
  subcategory: "mitb",
  title: "浏览器 MITB 交易视图固定审计",
  mode: "case-study",
  severity: "critical",
  difficulty: "advanced",
  summary:
    "通过两组固定交易视图三方对照，区分浏览器显示被篡改与三方一致的处置结论。",
  phase: "phase-1",
  tags: ["client", "mitb", "transaction-integrity", "trusted-path"],
  knowledgePoints: ["浏览器内篡改", "三方视图对照", "交易签名", "带外确认"],
  scoringDimensions: [
    {
      key: "view-assessment",
      title: "交易视图评估",
      description: "比对浏览器显示、服务端记录与带外确认通道的差异。",
      max: 1,
    },
    {
      key: "transaction-decision",
      title: "交易处置决策",
      description: "阻断不一致交易并确认一致交易的正常放行。",
      max: 1,
    },
  ],
  defaultCaseKey: mitbTransactionScenarioKey,
  cases: [
    {
      key: mitbTransactionScenarioKey,
      title: "固定浏览器交易视图审计",
      description:
        "对比一组三方不一致的篡改视图和一组三方一致的正常视图，不读取真实浏览器状态。",
      assets: [
        {
          key: "fixed-transaction-views",
          kind: "asset",
          title: "虚构交易视图摘要",
          detail: "只登记 virtual-* 收款方与教学金额，不含真实账户或卡号。",
        },
        {
          key: "fixed-trusted-path-policy",
          kind: "policy",
          title: "固定受信路径策略",
          detail: "要求服务端记录、带外通道一致并具备独立交易签名。",
        },
      ],
      evidence: [
        {
          key: "browser-view-mismatch",
          kind: "evidence",
          title: "浏览器视图不一致",
          detail: "固定篡改视图的收款方、金额与带外通道三处均不一致且未签名。",
        },
        {
          key: "consistent-signed-transaction",
          kind: "evidence",
          title: "一致且已签名交易",
          detail: "固定正常视图三方一致并具备独立签名。",
        },
      ],
      initialStepKey: "transaction-view-assessment",
      steps: [
        {
          key: "transaction-view-assessment",
          order: 1,
          title: "交易视图评估",
          prompt: "选择对固定交易视图的核对策略。",
          riskSignal: "client-mitb-assessment",
          options: [
            {
              key: "trust-browser-rendered-view",
              label: "只信任浏览器渲染出的交易字段（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: "client-mitb-browser-view-trusted",
              explanation:
                "漏洞路径把可能被篡改的浏览器上下文当作可信来源，忽略服务端与带外记录。",
              nextStepKey: "transaction-disposition",
              scoreDeltas: { "view-assessment": 0 },
            },
            {
              key: "compare-server-and-out-of-band-view",
              label: "比对服务端记录与带外确认通道",
              outcome: "fix",
              decision: "blocked",
              signal: "client-mitb-trusted-path-compared",
              explanation:
                "修复路径要求三方视图一致并具备独立交易签名，才认可交易内容。",
              nextStepKey: "transaction-disposition",
              scoreDeltas: { "view-assessment": 1 },
            },
          ],
        },
        {
          key: "transaction-disposition",
          order: 2,
          title: "交易处置",
          prompt: "根据固定对照摘要选择交易处置结论。",
          riskSignal: "client-mitb-decision",
          options: [
            {
              key: "submit-transaction-from-browser-view",
              label: "按浏览器显示提交交易（漏洞视角）",
              outcome: "risk",
              decision: "accepted",
              signal: mitbTransactionRiskSignal,
              explanation:
                "漏洞版按被篡改的浏览器视图提交，服务端实际记录的收款方与金额未被核对。",
              nextStepKey: null,
              scoreDeltas: { "transaction-decision": 0 },
            },
            {
              key: "block-mismatched-transaction",
              label: "阻断视图不一致的交易",
              outcome: "fix",
              decision: "blocked",
              signal: mitbTransactionDefenseSignal,
              explanation:
                "修复版阻断固定不一致交易，不发起任何真实支付、撤销或风控动作。",
              nextStepKey: null,
              scoreDeltas: { "transaction-decision": 1 },
            },
            {
              key: "confirm-consistent-transaction",
              label: "确认三方一致的正常交易",
              outcome: "normal",
              decision: "accepted",
              signal: mitbTransactionNormalSignal,
              explanation:
                "修复版确认三方一致且已签名的固定正常交易，证明受信路径不阻断正常业务。",
              nextStepKey: null,
              scoreDeltas: { "transaction-decision": 1 },
            },
          ],
        },
      ],
    },
  ],
  safeBoundaries: [
    "只使用两组冻结的虚构交易视图，不读取真实浏览器 DOM、扩展、Cookie、会话或凭据。",
    "收款方固定使用 virtual-* 标识，金额为教学常量，不含真实账户、卡号、IBAN 或商户号。",
    "页面和 API 只接受已登记 scenarioKey 与 optionKey，未知输入会被脱敏阻断。",
    "不发起真实支付、转账、扣款、撤销或任何金融接口调用，也不实现浏览器内篡改能力。",
  ],
  notes:
    "该实验只生成固定交易视图对照与学习摘要，不描述任何注入或篡改手法，也不提供 exploit.py。",
};

export type MitbTransactionWorkbench = {
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
  transactionViews: readonly FixedTransactionView[];
  viewAssessments: TransactionViewAssessment[];
};

export type MitbTransactionStepResult = {
  stepKey: string;
  optionKey: string;
  outcome: "risk" | "fix" | "normal";
  decision: "accepted" | "blocked";
  signal: string;
  explanation: string;
};

export type MitbTransactionDecision =
  (typeof transactionDecisions)[TransactionDecisionKey];

export type MitbTransactionEvaluationInput = {
  variantKey: MitbTransactionVariantKey;
  scenarioKey: string;
  decisions: string[];
};

export type MitbTransactionEvaluationResult = {
  status: "ok" | "blocked";
  labKey: string;
  variantKey: MitbTransactionVariantKey;
  scenarioKey: string;
  decision: "accepted" | "blocked";
  signal: string;
  message: string;
  nextStep: string;
  completed: boolean;
  steps: MitbTransactionStepResult[];
  viewAssessment: TransactionViewAssessment | null;
  transactionDecision: MitbTransactionDecision | null;
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

export type MitbTransactionLabService = {
  getWorkbench(): MitbTransactionWorkbench;
  evaluate(
    input: MitbTransactionEvaluationInput,
  ): MitbTransactionEvaluationResult;
};

function createBlockedResult(input: {
  variantKey: MitbTransactionVariantKey;
  matchedScenario: boolean;
  blockedReason: string;
}): MitbTransactionEvaluationResult {
  return {
    status: "blocked",
    labKey: mitbTransactionDefinition.id,
    variantKey: input.variantKey,
    scenarioKey: input.matchedScenario
      ? mitbTransactionScenarioKey
      : "blocked-scenario",
    decision: "blocked",
    signal: mitbTransactionBoundarySignal,
    message: "请求中的固定案例或决策未登记，服务未处理也未回显原始输入。",
    nextStep: "只选择工作台返回的固定 scenarioKey 与决策选项。",
    completed: false,
    steps: [],
    viewAssessment: null,
    transactionDecision: null,
    recap: {
      outcomeCounts: { risk: 0, fix: 0, normal: 0 },
      scores: {},
      terminalOutcome: null,
    },
    assessment: {
      riskLevel: mitbTransactionDefinition.severity,
      stepCount: 0,
      matchedScenario: input.matchedScenario,
    },
    blockedReason: input.blockedReason,
  };
}

function buildNextStep(input: {
  variantKey: MitbTransactionVariantKey;
  terminalOutcome: "risk" | "fix" | "normal" | null;
}) {
  if (input.variantKey === "vuln") {
    return "切换到修复版，对比服务端记录、带外通道和交易签名如何暴露视图篡改。";
  }

  if (input.terminalOutcome === "fix") {
    return "复盘不一致交易阻断结果后，再确认三方一致的正常交易基线。";
  }

  return "在事件日志中确认只记录固定视图 key、对照计数、终止结果和学习信号。";
}

function findView(viewKey: string) {
  return fixedTransactionViews.find((view) => view.viewKey === viewKey);
}

export function createMitbTransactionLabService(): MitbTransactionLabService {
  const viewAssessments = fixedTransactionViews.map(
    assessFixedTransactionView,
  );

  return {
    getWorkbench() {
      return {
        id: mitbTransactionDefinition.id,
        slug: mitbTransactionDefinition.slug,
        category: mitbTransactionDefinition.category,
        subcategory: mitbTransactionDefinition.subcategory,
        title: mitbTransactionDefinition.title,
        mode: mitbTransactionDefinition.mode,
        severity: mitbTransactionDefinition.severity,
        difficulty: mitbTransactionDefinition.difficulty,
        summary: mitbTransactionDefinition.summary,
        defaultScenarioKey: mitbTransactionDefinition.defaultCaseKey,
        scoringDimensions: mitbTransactionDefinition.scoringDimensions,
        cases: mitbTransactionDefinition.cases,
        safeBoundaries: [...mitbTransactionDefinition.safeBoundaries],
        notes: mitbTransactionDefinition.notes,
        transactionViews: structuredClone(fixedTransactionViews),
        viewAssessments: structuredClone(viewAssessments),
      };
    },

    evaluate(input) {
      if (input.scenarioKey !== mitbTransactionScenarioKey) {
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
        mitbTransactionDefinition,
        mitbTransactionScenarioKey,
      );
      const steps: MitbTransactionStepResult[] = [];

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
      const viewKey =
        viewKeyByAssessmentOption[steps[0].optionKey as AssessmentOptionKey];
      const view = viewKey ? findView(viewKey) : undefined;
      const transactionDecision =
        transactionDecisions[terminal.optionKey as TransactionDecisionKey];

      if (!view || !transactionDecision) {
        return createBlockedResult({
          variantKey: input.variantKey,
          matchedScenario: true,
          blockedReason: "registered-summary-missing",
        });
      }

      return {
        status: terminal.decision === "blocked" ? "blocked" : "ok",
        labKey: mitbTransactionDefinition.id,
        variantKey: input.variantKey,
        scenarioKey: mitbTransactionScenarioKey,
        decision: terminal.decision,
        signal: terminal.signal,
        message: terminal.explanation,
        nextStep: buildNextStep({
          variantKey: input.variantKey,
          terminalOutcome: recap.terminalOutcome,
        }),
        completed: true,
        steps,
        viewAssessment: assessFixedTransactionView(view),
        transactionDecision,
        recap: {
          outcomeCounts: recap.outcomeCounts,
          scores: recap.scores,
          terminalOutcome: recap.terminalOutcome,
        },
        assessment: {
          riskLevel: mitbTransactionDefinition.severity,
          stepCount: steps.length,
          matchedScenario: true,
        },
        ...(terminal.decision === "blocked"
          ? { blockedReason: "mismatched-transaction-blocked" }
          : {}),
      };
    },
  };
}

