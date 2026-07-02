export type PhishingVariantKey = "vuln" | "fixed";

export type PhishingCaseKey =
  | "invoice-urgent-review"
  | "account-security-alert"
  | "hr-benefit-update"
  | "internal-security-newsletter";

export type PhishingReviewModeKey =
  | "surface-only"
  | "indicator-review"
  | "reporting-flow";

export type PhishingDefenseChecklistKey =
  | "none"
  | "sender-domain-check"
  | "report-isolate-confirm"
  | "safe-release-check";

export type PhishingRiskIndicator =
  | "domain-lookalike"
  | "urgency-signal"
  | "credential-request"
  | "attachment-risk"
  | "business-context-mismatch"
  | "brand-impersonation";

export type PhishingSignal =
  | "phishing-lookalike-domain-overlooked"
  | "phishing-credential-request-visible"
  | "phishing-attachment-risk-visible"
  | "phishing-reporting-flow-applied"
  | "phishing-safe-message-accepted"
  | "phishing-case-boundary-verified";

export type PhishingStatus = "ok" | "blocked";

export type PhishingInput = {
  userId: string;
  variantKey: PhishingVariantKey;
  caseKey: string;
  reviewModeKey: string;
  defenseChecklistKey: string;
};

export type PhishingCaseSummary = {
  caseKey: PhishingCaseKey;
  title: string;
  surfaceCue: string;
  businessContext: string;
  riskLevel: "low" | "medium" | "high";
  indicatorLabels: string[];
  learningNotes: string;
};

export type PhishingInspection = {
  caseAllowed: boolean;
  reviewModeAllowed: boolean;
  checklistAllowed: boolean;
  indicatorCount: number;
  riskIndicators: PhishingRiskIndicator[];
  matchedControlledCase: boolean;
  surfaceBias: boolean;
  checklistApplied: boolean;
  recommendedAction: string;
  riskLevel: "low" | "medium" | "high";
};

export type PhishingResult = {
  status: PhishingStatus;
  variantKey: PhishingVariantKey;
  caseKey: string;
  reviewModeKey: string;
  defenseChecklistKey: string;
  caseSummary: PhishingCaseSummary | null;
  inspection: PhishingInspection;
  signal: PhishingSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type PhishingLabService = {
  reviewCase(input: PhishingInput): Promise<PhishingResult>;
};

type PhishingCaseDefinition = PhishingCaseSummary & {
  riskIndicators: PhishingRiskIndicator[];
  recommendedAction: string;
};

type PhishingReviewModeDefinition = {
  reviewModeKey: PhishingReviewModeKey;
  title: string;
  checklistApplied: boolean;
  surfaceBias: boolean;
};

type PhishingDefenseChecklistDefinition = {
  defenseChecklistKey: PhishingDefenseChecklistKey;
  title: string;
  recommendedAction: string;
  checklistApplied: boolean;
};

export const phishingDefaultCaseKey: PhishingCaseKey =
  "account-security-alert";
export const phishingDefaultReviewModeKey: PhishingReviewModeKey =
  "surface-only";
export const phishingDefaultDefenseChecklistKey: PhishingDefenseChecklistKey =
  "none";

const phishingCases = new Map<PhishingCaseKey, PhishingCaseDefinition>([
  [
    "invoice-urgent-review",
    {
      caseKey: "invoice-urgent-review",
      title: "发票复核线索卡",
      surfaceCue: "紧急复核与附件提示",
      businessContext: "固定财务复核案例",
      riskLevel: "high",
      indicatorLabels: ["紧急语气", "附件诱导", "业务上下文异常"],
      learningNotes: "观察紧急语气如何压缩附件和业务上下文核验。",
      riskIndicators: [
        "urgency-signal",
        "attachment-risk",
        "business-context-mismatch",
      ],
      recommendedAction: "isolate-and-confirm-via-finance",
    },
  ],
  [
    "account-security-alert",
    {
      caseKey: "account-security-alert",
      title: "账号安全提醒线索卡",
      surfaceCue: "安全提醒与凭据请求",
      businessContext: "固定账号安全提醒案例",
      riskLevel: "high",
      indicatorLabels: ["相似域名", "凭据请求", "紧急语气"],
      learningNotes: "观察显示名可信时，相似域名和凭据请求如何被忽略。",
      riskIndicators: [
        "domain-lookalike",
        "credential-request",
        "urgency-signal",
      ],
      recommendedAction: "report-and-reset-through-official-channel",
    },
  ],
  [
    "hr-benefit-update",
    {
      caseKey: "hr-benefit-update",
      title: "人事福利更新线索卡",
      surfaceCue: "福利更新与附件提示",
      businessContext: "固定人事通知案例",
      riskLevel: "medium",
      indicatorLabels: ["品牌仿冒", "附件诱导", "业务上下文异常"],
      learningNotes: "观察跨部门通知如何通过品牌仿冒和附件诱导制造误判。",
      riskIndicators: [
        "brand-impersonation",
        "attachment-risk",
        "business-context-mismatch",
      ],
      recommendedAction: "confirm-through-hr-channel",
    },
  ],
  [
    "internal-security-newsletter",
    {
      caseKey: "internal-security-newsletter",
      title: "内部安全周报线索卡",
      surfaceCue: "常规安全提醒",
      businessContext: "固定安全教育消息案例",
      riskLevel: "low",
      indicatorLabels: [],
      learningNotes: "观察基础核验完成后，正常消息如何保持可接受。",
      riskIndicators: [],
      recommendedAction: "release-after-basic-check",
    },
  ],
]);

const reviewModes = new Map<
  PhishingReviewModeKey,
  PhishingReviewModeDefinition
>([
  [
    "surface-only",
    {
      reviewModeKey: "surface-only",
      title: "只看表面信息",
      checklistApplied: false,
      surfaceBias: true,
    },
  ],
  [
    "indicator-review",
    {
      reviewModeKey: "indicator-review",
      title: "逐项线索复核",
      checklistApplied: true,
      surfaceBias: false,
    },
  ],
  [
    "reporting-flow",
    {
      reviewModeKey: "reporting-flow",
      title: "举报与隔离流程",
      checklistApplied: true,
      surfaceBias: false,
    },
  ],
]);

const defenseChecklists = new Map<
  PhishingDefenseChecklistKey,
  PhishingDefenseChecklistDefinition
>([
  [
    "none",
    {
      defenseChecklistKey: "none",
      title: "无检查清单",
      recommendedAction: "surface-release-observed",
      checklistApplied: false,
    },
  ],
  [
    "sender-domain-check",
    {
      defenseChecklistKey: "sender-domain-check",
      title: "发件人和域名核验",
      recommendedAction: "verify-sender-domain-before-action",
      checklistApplied: true,
    },
  ],
  [
    "report-isolate-confirm",
    {
      defenseChecklistKey: "report-isolate-confirm",
      title: "举报、隔离和二次确认",
      recommendedAction: "report-isolate-and-confirm",
      checklistApplied: true,
    },
  ],
  [
    "safe-release-check",
    {
      defenseChecklistKey: "safe-release-check",
      title: "安全放行检查",
      recommendedAction: "release-after-basic-check",
      checklistApplied: true,
    },
  ],
]);

function isCaseKey(value: string): value is PhishingCaseKey {
  return phishingCases.has(value as PhishingCaseKey);
}

function isReviewModeKey(value: string): value is PhishingReviewModeKey {
  return reviewModes.has(value as PhishingReviewModeKey);
}

function isDefenseChecklistKey(
  value: string,
): value is PhishingDefenseChecklistKey {
  return defenseChecklists.has(value as PhishingDefenseChecklistKey);
}

function createCaseSummary(
  definition: PhishingCaseDefinition,
): PhishingCaseSummary {
  return {
    caseKey: definition.caseKey,
    title: definition.title,
    surfaceCue: definition.surfaceCue,
    businessContext: definition.businessContext,
    riskLevel: definition.riskLevel,
    indicatorLabels: definition.indicatorLabels,
    learningNotes: definition.learningNotes,
  };
}
function resolveRiskSignal(definition: PhishingCaseDefinition): PhishingSignal {
  if (definition.riskIndicators.includes("domain-lookalike")) {
    return "phishing-lookalike-domain-overlooked";
  }

  if (definition.riskIndicators.includes("credential-request")) {
    return "phishing-credential-request-visible";
  }

  return "phishing-attachment-risk-visible";
}

function createInspection(input: {
  caseAllowed: boolean;
  reviewModeAllowed: boolean;
  checklistAllowed: boolean;
  definition: PhishingCaseDefinition | null;
  reviewMode: PhishingReviewModeDefinition | null;
  checklist: PhishingDefenseChecklistDefinition | null;
}): PhishingInspection {
  return {
    caseAllowed: input.caseAllowed,
    reviewModeAllowed: input.reviewModeAllowed,
    checklistAllowed: input.checklistAllowed,
    indicatorCount: input.definition?.riskIndicators.length ?? 0,
    riskIndicators: input.definition?.riskIndicators ?? [],
    matchedControlledCase: Boolean(input.definition),
    surfaceBias: Boolean(input.reviewMode?.surfaceBias),
    checklistApplied: Boolean(
      input.reviewMode?.checklistApplied || input.checklist?.checklistApplied,
    ),
    recommendedAction:
      input.checklist?.recommendedAction ??
      input.definition?.recommendedAction ??
      "blocked-unregistered-case",
    riskLevel: input.definition?.riskLevel ?? "medium",
  };
}

function createBlockedBoundaryResult(input: {
  variantKey: PhishingVariantKey;
  caseKey: string;
  reviewModeKey: string;
  defenseChecklistKey: string;
  blockedReason: string;
}): PhishingResult {
  const safeCaseKey = isCaseKey(input.caseKey) ? input.caseKey : "blocked-case";
  const safeReviewModeKey = isReviewModeKey(input.reviewModeKey)
    ? input.reviewModeKey
    : "blocked-review-mode";
  const safeDefenseChecklistKey = isDefenseChecklistKey(
    input.defenseChecklistKey,
  )
    ? input.defenseChecklistKey
    : "blocked-checklist";
  const definition = isCaseKey(input.caseKey)
    ? phishingCases.get(input.caseKey) ?? null
    : null;
  const reviewMode = isReviewModeKey(input.reviewModeKey)
    ? reviewModes.get(input.reviewModeKey) ?? null
    : null;
  const checklist = isDefenseChecklistKey(input.defenseChecklistKey)
    ? defenseChecklists.get(input.defenseChecklistKey) ?? null
    : null;

  return {
    status: "blocked",
    variantKey: input.variantKey,
    caseKey: safeCaseKey,
    reviewModeKey: safeReviewModeKey,
    defenseChecklistKey: safeDefenseChecklistKey,
    caseSummary: definition ? createCaseSummary(definition) : null,
    inspection: createInspection({
      caseAllowed: Boolean(definition),
      reviewModeAllowed: Boolean(reviewMode),
      checklistAllowed: Boolean(checklist),
      definition,
      reviewMode,
      checklist,
    }),
    signal: "phishing-case-boundary-verified",
    decision: "blocked",
    message: "该网络钓鱼固定案例或检查策略不在允许列表中，未处理任何任意邮件内容。",
    nextStep: "只选择文档或页面列出的固定 caseKey、reviewModeKey 和 defenseChecklistKey。",
    blockedReason: input.blockedReason,
  };
}

function createMessage(input: {
  signal: PhishingSignal;
  variantKey: PhishingVariantKey;
}) {
  if (input.signal === "phishing-reporting-flow-applied") {
    return "修复版识别到固定高风险线索，并给出举报、隔离和二次确认建议。";
  }

  if (input.signal === "phishing-safe-message-accepted") {
    return "固定安全消息通过基础核验，正常业务通知保持可接受。";
  }

  if (input.signal === "phishing-lookalike-domain-overlooked") {
    return "漏洞版只关注显示名和紧急提醒，忽略了固定相似域名风险。";
  }

  if (input.signal === "phishing-credential-request-visible") {
    return "固定案例暴露凭据请求风险，学习者应通过安全通道复核。";
  }

  if (input.signal === "phishing-attachment-risk-visible") {
    return "固定案例暴露附件诱导和业务上下文异常，学习者应先隔离再确认。";
  }

  return "固定案例边界已校验，服务不会处理任意邮件正文或真实目标。";
}

function createNextStep(input: {
  signal: PhishingSignal;
  variantKey: PhishingVariantKey;
}) {
  if (input.variantKey === "vuln") {
    return "使用同一固定案例切换到修复版，观察检查清单如何改变判定。";
  }

  if (input.signal === "phishing-safe-message-accepted") {
    return "切换到账号安全提醒或发票复核案例，观察风险线索如何触发阻断。";
  }

  return "复盘事件日志中的风险标签、建议动作和学习信号，确认没有保存真实邮件内容。";
}

function resolveSignal(input: {
  variantKey: PhishingVariantKey;
  definition: PhishingCaseDefinition;
  reviewModeKey: PhishingReviewModeKey;
  defenseChecklistKey: PhishingDefenseChecklistKey;
}): PhishingSignal {
  if (input.definition.riskIndicators.length === 0) {
    return "phishing-safe-message-accepted";
  }

  if (
    input.variantKey === "fixed" &&
    (input.reviewModeKey === "reporting-flow" ||
      input.defenseChecklistKey === "report-isolate-confirm")
  ) {
    return "phishing-reporting-flow-applied";
  }

  return resolveRiskSignal(input.definition);
}

export function createPhishingLabService(): PhishingLabService {
  return {
    async reviewCase(input) {
      const caseKey = input.caseKey.trim();
      const reviewModeKey = input.reviewModeKey.trim();
      const defenseChecklistKey = input.defenseChecklistKey.trim();

      if (!isCaseKey(caseKey)) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          caseKey,
          reviewModeKey,
          defenseChecklistKey,
          blockedReason: "case-not-allowed",
        });
      }

      if (!isReviewModeKey(reviewModeKey)) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          caseKey,
          reviewModeKey,
          defenseChecklistKey,
          blockedReason: "review-mode-not-allowed",
        });
      }

      if (!isDefenseChecklistKey(defenseChecklistKey)) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          caseKey,
          reviewModeKey,
          defenseChecklistKey,
          blockedReason: "checklist-not-allowed",
        });
      }

      const definition = phishingCases.get(caseKey);
      const reviewMode = reviewModes.get(reviewModeKey);
      const checklist = defenseChecklists.get(defenseChecklistKey);

      if (!definition || !reviewMode || !checklist) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          caseKey,
          reviewModeKey,
          defenseChecklistKey,
          blockedReason: "case-definition-not-found",
        });
      }

      const signal = resolveSignal({
        variantKey: input.variantKey,
        definition,
        reviewModeKey,
        defenseChecklistKey,
      });
      const riskyCase = definition.riskIndicators.length > 0;
      const blockedByDefense = input.variantKey === "fixed" && riskyCase;
      const inspection = createInspection({
        caseAllowed: true,
        reviewModeAllowed: true,
        checklistAllowed: true,
        definition,
        reviewMode,
        checklist,
      });

      return {
        status: blockedByDefense ? "blocked" : "ok",
        variantKey: input.variantKey,
        caseKey,
        reviewModeKey,
        defenseChecklistKey,
        caseSummary: createCaseSummary(definition),
        inspection,
        signal,
        decision: blockedByDefense ? "blocked" : "accepted",
        message: createMessage({
          signal,
          variantKey: input.variantKey,
        }),
        nextStep: createNextStep({
          signal,
          variantKey: input.variantKey,
        }),
        ...(blockedByDefense
          ? { blockedReason: "phishing-risk-checklist-applied" }
          : {}),
      };
    },
  };
}
