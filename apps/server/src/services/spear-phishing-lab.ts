export type SpearPhishingVariantKey = "vuln" | "fixed";

export type SpearPhishingCaseKey =
  | "executive-invoice-approval"
  | "vendor-payment-change"
  | "engineering-access-request"
  | "hr-benefit-personalized";

export type SpearPhishingVerificationPolicyKey =
  | "context-only"
  | "out-of-band-confirmation"
  | "approval-chain-review"
  | "least-privilege-review"
  | "report-and-isolate";

export type SpearPhishingRiskIndicator =
  | "authority-pressure"
  | "urgency-pressure"
  | "approval-chain-bypass"
  | "business-context-trust"
  | "payment-change-risk"
  | "temporary-access-risk"
  | "least-privilege-missing"
  | "official-channel-bypass"
  | "attachment-isolation-missing";

export type SpearPhishingSignal =
  | "spear-phishing-context-trust-overweighted"
  | "spear-phishing-approval-chain-bypassed"
  | "spear-phishing-out-of-band-confirmation-required"
  | "spear-phishing-boundary-verified";

export type SpearPhishingStatus = "ok" | "blocked";

export type SpearPhishingInput = {
  userId: string;
  variantKey: SpearPhishingVariantKey;
  caseKey: string;
  verificationPolicyKey: string;
};

export type SpearPhishingCaseSummary = {
  caseKey: SpearPhishingCaseKey;
  title: string;
  roleContext: string;
  processContext: string;
  riskLevel: "medium" | "high";
  clueLabels: string[];
  learningNotes: string;
};

export type SpearPhishingAssessment = {
  caseAllowed: boolean;
  policyAllowed: boolean;
  riskIndicatorCount: number;
  riskIndicators: SpearPhishingRiskIndicator[];
  matchedControlledCase: boolean;
  contextTrustBias: boolean;
  verificationApplied: boolean;
  approvalChainRequired: boolean;
  outOfBandRequired: boolean;
  recommendedAction: string;
  riskLevel: "medium" | "high";
};

export type SpearPhishingResult = {
  status: SpearPhishingStatus;
  variantKey: SpearPhishingVariantKey;
  caseKey: string;
  verificationPolicyKey: string;
  caseSummary: SpearPhishingCaseSummary | null;
  assessment: SpearPhishingAssessment;
  signal: SpearPhishingSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type SpearPhishingLabService = {
  reviewCase(input: SpearPhishingInput): Promise<SpearPhishingResult>;
};

type SpearPhishingCaseDefinition = SpearPhishingCaseSummary & {
  riskIndicators: SpearPhishingRiskIndicator[];
  recommendedAction: string;
};

type SpearPhishingVerificationPolicyDefinition = {
  verificationPolicyKey: SpearPhishingVerificationPolicyKey;
  title: string;
  verificationApplied: boolean;
  contextTrustBias: boolean;
  approvalChainRequired: boolean;
  outOfBandRequired: boolean;
  recommendedAction: string;
};

export const spearPhishingDefaultCaseKey: SpearPhishingCaseKey =
  "executive-invoice-approval";
export const spearPhishingDefaultVerificationPolicyKey: SpearPhishingVerificationPolicyKey =
  "context-only";

const spearPhishingCases = new Map<
  SpearPhishingCaseKey,
  SpearPhishingCaseDefinition
>([
  [
    "executive-invoice-approval",
    {
      caseKey: "executive-invoice-approval",
      title: "高权威付款审批线索卡",
      roleContext: "高权威业务角色与付款审批执行者",
      processContext: "财务审批链与可信通道二次确认",
      riskLevel: "high",
      clueLabels: ["角色权威", "紧急压力", "审批链绕过"],
      learningNotes: "观察权威压力和紧急付款语境如何压缩正式审批链核验。",
      riskIndicators: [
        "authority-pressure",
        "urgency-pressure",
        "approval-chain-bypass",
      ],
      recommendedAction: "finance-approval-chain-and-dual-review",
    },
  ],
  [
    "vendor-payment-change",
    {
      caseKey: "vendor-payment-change",
      title: "供应商付款变更线索卡",
      roleContext: "供应商协作角色与主数据维护者",
      processContext: "供应商付款信息变更与可信渠道回拨",
      riskLevel: "high",
      clueLabels: ["业务熟悉感", "付款信息变更", "流程例外"],
      learningNotes: "观察供应商协作语境如何让业务熟悉感覆盖主数据变更流程。",
      riskIndicators: [
        "business-context-trust",
        "payment-change-risk",
        "approval-chain-bypass",
      ],
      recommendedAction: "vendor-master-data-change-review",
    },
  ],
  [
    "engineering-access-request",
    {
      caseKey: "engineering-access-request",
      title: "工程临时访问线索卡",
      roleContext: "跨团队协作角色与权限审批者",
      processContext: "临时访问申请、工单绑定和权限有效期",
      riskLevel: "high",
      clueLabels: ["紧急排障", "临时访问", "最小授权缺失"],
      learningNotes: "观察工程协作语境下临时访问请求如何绕过最小授权。",
      riskIndicators: [
        "business-context-trust",
        "temporary-access-risk",
        "least-privilege-missing",
      ],
      recommendedAction: "ticket-bound-least-privilege-review",
    },
  ],
  [
    "hr-benefit-personalized",
    {
      caseKey: "hr-benefit-personalized",
      title: "人事福利个性化线索卡",
      roleContext: "人事通知角色与员工自助处理者",
      processContext: "HR 官方入口、内部公告和附件隔离",
      riskLevel: "medium",
      clueLabels: ["个性化语境", "官方入口混淆", "附件隔离缺失"],
      learningNotes: "观察人事福利语境如何诱导学习者绕开官方入口和隔离流程。",
      riskIndicators: [
        "business-context-trust",
        "official-channel-bypass",
        "attachment-isolation-missing",
      ],
      recommendedAction: "hr-official-channel-and-isolation",
    },
  ],
]);

const verificationPolicies = new Map<
  SpearPhishingVerificationPolicyKey,
  SpearPhishingVerificationPolicyDefinition
>([
  [
    "context-only",
    {
      verificationPolicyKey: "context-only",
      title: "只看上下文可信度",
      verificationApplied: false,
      contextTrustBias: true,
      approvalChainRequired: false,
      outOfBandRequired: false,
      recommendedAction: "surface-context-release-observed",
    },
  ],
  [
    "out-of-band-confirmation",
    {
      verificationPolicyKey: "out-of-band-confirmation",
      title: "可信通道二次确认",
      verificationApplied: true,
      contextTrustBias: false,
      approvalChainRequired: false,
      outOfBandRequired: true,
      recommendedAction: "confirm-through-trusted-channel",
    },
  ],
  [
    "approval-chain-review",
    {
      verificationPolicyKey: "approval-chain-review",
      title: "审批链复核",
      verificationApplied: true,
      contextTrustBias: false,
      approvalChainRequired: true,
      outOfBandRequired: true,
      recommendedAction: "restore-approval-chain-before-action",
    },
  ],
  [
    "least-privilege-review",
    {
      verificationPolicyKey: "least-privilege-review",
      title: "最小授权复核",
      verificationApplied: true,
      contextTrustBias: false,
      approvalChainRequired: true,
      outOfBandRequired: true,
      recommendedAction: "limit-scope-expiry-and-review",
    },
  ],
  [
    "report-and-isolate",
    {
      verificationPolicyKey: "report-and-isolate",
      title: "隔离举报与复盘",
      verificationApplied: true,
      contextTrustBias: false,
      approvalChainRequired: true,
      outOfBandRequired: true,
      recommendedAction: "report-isolate-and-recap",
    },
  ],
]);

function isCaseKey(value: string): value is SpearPhishingCaseKey {
  return spearPhishingCases.has(value as SpearPhishingCaseKey);
}

function isVerificationPolicyKey(
  value: string,
): value is SpearPhishingVerificationPolicyKey {
  return verificationPolicies.has(value as SpearPhishingVerificationPolicyKey);
}

function createCaseSummary(
  definition: SpearPhishingCaseDefinition,
): SpearPhishingCaseSummary {
  return {
    caseKey: definition.caseKey,
    title: definition.title,
    roleContext: definition.roleContext,
    processContext: definition.processContext,
    riskLevel: definition.riskLevel,
    clueLabels: definition.clueLabels,
    learningNotes: definition.learningNotes,
  };
}

function createAssessment(input: {
  caseAllowed: boolean;
  policyAllowed: boolean;
  definition: SpearPhishingCaseDefinition | null;
  policy: SpearPhishingVerificationPolicyDefinition | null;
}): SpearPhishingAssessment {
  return {
    caseAllowed: input.caseAllowed,
    policyAllowed: input.policyAllowed,
    riskIndicatorCount: input.definition?.riskIndicators.length ?? 0,
    riskIndicators: input.definition?.riskIndicators ?? [],
    matchedControlledCase: Boolean(input.definition),
    contextTrustBias: Boolean(input.policy?.contextTrustBias),
    verificationApplied: Boolean(input.policy?.verificationApplied),
    approvalChainRequired: Boolean(input.policy?.approvalChainRequired),
    outOfBandRequired: Boolean(input.policy?.outOfBandRequired),
    recommendedAction:
      input.policy?.recommendedAction ??
      input.definition?.recommendedAction ??
      "blocked-unregistered-case",
    riskLevel: input.definition?.riskLevel ?? "medium",
  };
}

function createBlockedBoundaryResult(input: {
  variantKey: SpearPhishingVariantKey;
  caseKey: string;
  verificationPolicyKey: string;
  blockedReason: string;
}): SpearPhishingResult {
  const safeCaseKey = isCaseKey(input.caseKey)
    ? input.caseKey
    : "blocked-case";
  const safeVerificationPolicyKey = isVerificationPolicyKey(
    input.verificationPolicyKey,
  )
    ? input.verificationPolicyKey
    : "blocked-verification-policy";
  const definition = isCaseKey(input.caseKey)
    ? spearPhishingCases.get(input.caseKey) ?? null
    : null;
  const policy = isVerificationPolicyKey(input.verificationPolicyKey)
    ? verificationPolicies.get(input.verificationPolicyKey) ?? null
    : null;

  return {
    status: "blocked",
    variantKey: input.variantKey,
    caseKey: safeCaseKey,
    verificationPolicyKey: safeVerificationPolicyKey,
    caseSummary: definition ? createCaseSummary(definition) : null,
    assessment: createAssessment({
      caseAllowed: Boolean(definition),
      policyAllowed: Boolean(policy),
      definition,
      policy,
    }),
    signal: "spear-phishing-boundary-verified",
    decision: "blocked",
    message: "该鱼叉式钓鱼固定案例或检查策略不在允许列表中，未处理任何真实人员、邮箱、链接或正文。",
    nextStep: "只选择文档列出的固定 caseKey 和 verificationPolicyKey。",
    blockedReason: input.blockedReason,
  };
}

function resolveSignal(input: {
  variantKey: SpearPhishingVariantKey;
  definition: SpearPhishingCaseDefinition;
  policy: SpearPhishingVerificationPolicyDefinition;
}): SpearPhishingSignal {
  if (input.variantKey === "fixed") {
    if (input.policy.outOfBandRequired) {
      return "spear-phishing-out-of-band-confirmation-required";
    }

    return "spear-phishing-boundary-verified";
  }

  if (input.definition.riskIndicators.includes("approval-chain-bypass")) {
    return "spear-phishing-approval-chain-bypassed";
  }

  return "spear-phishing-context-trust-overweighted";
}

function createMessage(input: {
  signal: SpearPhishingSignal;
  variantKey: SpearPhishingVariantKey;
}) {
  if (input.signal === "spear-phishing-approval-chain-bypassed") {
    return "漏洞版只看角色权威和业务熟悉感，固定案例中的审批链绕过风险被错误放行。";
  }

  if (input.signal === "spear-phishing-context-trust-overweighted") {
    return "漏洞版过度依赖针对性上下文，忽略了可信通道和流程核验。";
  }

  if (input.signal === "spear-phishing-out-of-band-confirmation-required") {
    return "修复版要求可信通道二次确认和正式流程复核，已阻断固定高风险请求。";
  }

  return "固定案例边界已校验，服务不会处理真实投递内容、人员信息或外部目标。";
}

function createNextStep(input: {
  signal: SpearPhishingSignal;
  variantKey: SpearPhishingVariantKey;
}) {
  if (input.variantKey === "vuln") {
    return "使用同一固定案例切换到修复版，观察二次确认和审批链如何改变判定。";
  }

  if (input.signal === "spear-phishing-out-of-band-confirmation-required") {
    return "复盘事件日志中的固定 key、风险类别、建议动作和学习信号，确认没有保存真实业务材料。";
  }

  return "继续检查固定案例是否只使用虚构角色标签和安全摘要。";
}

export function createSpearPhishingLabService(): SpearPhishingLabService {
  return {
    async reviewCase(input) {
      const caseKey = input.caseKey.trim();
      const verificationPolicyKey = input.verificationPolicyKey.trim();

      if (!isCaseKey(caseKey)) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          caseKey,
          verificationPolicyKey,
          blockedReason: "case-not-allowed",
        });
      }

      if (!isVerificationPolicyKey(verificationPolicyKey)) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          caseKey,
          verificationPolicyKey,
          blockedReason: "verification-policy-not-allowed",
        });
      }

      const definition = spearPhishingCases.get(caseKey);
      const policy = verificationPolicies.get(verificationPolicyKey);

      if (!definition || !policy) {
        return createBlockedBoundaryResult({
          variantKey: input.variantKey,
          caseKey,
          verificationPolicyKey,
          blockedReason: "case-definition-not-found",
        });
      }

      const signal = resolveSignal({
        variantKey: input.variantKey,
        definition,
        policy,
      });
      const blockedByDefense =
        input.variantKey === "fixed" && policy.verificationApplied;
      const assessment = createAssessment({
        caseAllowed: true,
        policyAllowed: true,
        definition,
        policy,
      });

      return {
        status: blockedByDefense ? "blocked" : "ok",
        variantKey: input.variantKey,
        caseKey,
        verificationPolicyKey,
        caseSummary: createCaseSummary(definition),
        assessment,
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
          ? { blockedReason: "spear-phishing-verification-required" }
          : {}),
      };
    },
  };
}
