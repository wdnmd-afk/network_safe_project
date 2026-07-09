export type WhalingVariantKey = "vuln" | "fixed";

export type WhalingCaseKey =
  | "executive-wire-approval"
  | "board-confidential-request"
  | "legal-settlement-transfer"
  | "ma-data-room-access";

export type WhalingVerificationPolicyKey =
  | "authority-context-only"
  | "trusted-channel-callback"
  | "payment-dual-approval"
  | "legal-board-channel-review"
  | "least-privilege-data-room"
  | "freeze-and-escalate";

export type WhalingRiskIndicator =
  | "executive-authority-pressure"
  | "confidentiality-pressure"
  | "payment-urgency"
  | "approval-chain-bypass"
  | "legal-settlement-pressure"
  | "data-room-access-risk"
  | "least-privilege-missing"
  | "trusted-channel-missing";

export type WhalingSignal =
  | "whaling-executive-authority-overweighted"
  | "whaling-confidential-pressure-identified"
  | "whaling-payment-freeze-required"
  | "whaling-boundary-verified";

export type WhalingStatus = "ok" | "blocked";

export type WhalingInput = {
  userId: string;
  variantKey: WhalingVariantKey;
  caseKey: string;
  verificationPolicyKey: string;
};

export type WhalingCaseSummary = {
  caseKey: WhalingCaseKey;
  title: string;
  roleContext: string;
  processContext: string;
  riskLevel: "high" | "critical";
  clueLabels: string[];
  learningNotes: string;
};

export type WhalingAssessment = {
  caseAllowed: boolean;
  policyAllowed: boolean;
  riskIndicatorCount: number;
  riskIndicators: WhalingRiskIndicator[];
  matchedControlledCase: boolean;
  authorityContextBias: boolean;
  verificationApplied: boolean;
  trustedChannelRequired: boolean;
  paymentFreezeRequired: boolean;
  legalBoardReviewRequired: boolean;
  leastPrivilegeRequired: boolean;
  recommendedAction: string;
  riskLevel: "high" | "critical";
};

export type WhalingResult = {
  status: WhalingStatus;
  variantKey: WhalingVariantKey;
  caseKey: string;
  verificationPolicyKey: string;
  caseSummary: WhalingCaseSummary | null;
  assessment: WhalingAssessment;
  signal: WhalingSignal;
  decision: "accepted" | "blocked";
  message: string;
  nextStep: string;
  blockedReason?: string;
};

export type WhalingLabService = {
  reviewCase(input: WhalingInput): Promise<WhalingResult>;
};

type WhalingCaseDefinition = WhalingCaseSummary & {
  riskIndicators: WhalingRiskIndicator[];
  recommendedAction: string;
};

type WhalingVerificationPolicyDefinition = {
  verificationPolicyKey: WhalingVerificationPolicyKey;
  title: string;
  verificationApplied: boolean;
  authorityContextBias: boolean;
  trustedChannelRequired: boolean;
  paymentFreezeRequired: boolean;
  legalBoardReviewRequired: boolean;
  leastPrivilegeRequired: boolean;
  recommendedAction: string;
};

export const whalingDefaultCaseKey: WhalingCaseKey =
  "executive-wire-approval";
export const whalingDefaultVerificationPolicyKey: WhalingVerificationPolicyKey =
  "authority-context-only";

const whalingCases = new Map<WhalingCaseKey, WhalingCaseDefinition>([
  [
    "executive-wire-approval",
    {
      caseKey: "executive-wire-approval",
      title: "高层紧急大额付款线索卡",
      roleContext: "高层决策角色与大额付款执行者",
      processContext: "财务付款审批链、可信通道回拨和双人复核",
      riskLevel: "critical",
      clueLabels: ["高权威压力", "紧急时限", "审批链跳过", "保密理由"],
      learningNotes: "观察高层授权标签和紧急付款语境如何压缩正式核验。",
      riskIndicators: [
        "executive-authority-pressure",
        "confidentiality-pressure",
        "payment-urgency",
        "approval-chain-bypass",
        "trusted-channel-missing",
      ],
      recommendedAction: "freeze-payment-and-dual-approval",
    },
  ],
  [
    "board-confidential-request",
    {
      caseKey: "board-confidential-request",
      title: "董事会保密事项线索卡",
      roleContext: "董事会事务角色与高敏事项协作执行者",
      processContext: "董事会固定事务通道、法务核验和例外审批记录",
      riskLevel: "critical",
      clueLabels: ["保密压力", "越级请求", "角色模糊", "审计缺失"],
      learningNotes: "观察保密事项和越级请求如何削弱固定流程复核。",
      riskIndicators: [
        "executive-authority-pressure",
        "confidentiality-pressure",
        "approval-chain-bypass",
        "trusted-channel-missing",
      ],
      recommendedAction: "board-channel-legal-review-and-exception-log",
    },
  ],
  [
    "legal-settlement-transfer",
    {
      caseKey: "legal-settlement-transfer",
      title: "法务结算付款线索卡",
      roleContext: "外部顾问协作角色与法务或财务执行者",
      processContext: "案件编号、顾问白名单、法务负责人确认和财务复核",
      riskLevel: "critical",
      clueLabels: ["外部顾问权威", "案件压力", "付款例外", "信息不完整"],
      learningNotes: "观察法务和外部顾问语境如何制造紧急合规压力。",
      riskIndicators: [
        "legal-settlement-pressure",
        "confidentiality-pressure",
        "payment-urgency",
        "approval-chain-bypass",
        "trusted-channel-missing",
      ],
      recommendedAction: "legal-case-verification-and-finance-review",
    },
  ],
  [
    "ma-data-room-access",
    {
      caseKey: "ma-data-room-access",
      title: "并购资料室临时访问线索卡",
      roleContext: "重大交易协作角色与资料室权限管理员",
      processContext: "临时资料室访问审批、安全团队复核和权限有效期",
      riskLevel: "high",
      clueLabels: ["重大交易语境", "临时权限", "审批缺失", "最小授权失守"],
      learningNotes: "观察重大交易语境如何让最小授权和有效期被忽略。",
      riskIndicators: [
        "executive-authority-pressure",
        "confidentiality-pressure",
        "data-room-access-risk",
        "least-privilege-missing",
      ],
      recommendedAction: "least-privilege-data-room-review",
    },
  ],
]);

const verificationPolicies = new Map<
  WhalingVerificationPolicyKey,
  WhalingVerificationPolicyDefinition
>([
  [
    "authority-context-only",
    {
      verificationPolicyKey: "authority-context-only",
      title: "只看权威和上下文",
      verificationApplied: false,
      authorityContextBias: true,
      trustedChannelRequired: false,
      paymentFreezeRequired: false,
      legalBoardReviewRequired: false,
      leastPrivilegeRequired: false,
      recommendedAction: "authority-context-release-observed",
    },
  ],
  [
    "trusted-channel-callback",
    {
      verificationPolicyKey: "trusted-channel-callback",
      title: "可信通道回拨确认",
      verificationApplied: true,
      authorityContextBias: false,
      trustedChannelRequired: true,
      paymentFreezeRequired: false,
      legalBoardReviewRequired: false,
      leastPrivilegeRequired: false,
      recommendedAction: "confirm-through-registered-channel",
    },
  ],
  [
    "payment-dual-approval",
    {
      verificationPolicyKey: "payment-dual-approval",
      title: "大额付款双人复核",
      verificationApplied: true,
      authorityContextBias: false,
      trustedChannelRequired: true,
      paymentFreezeRequired: true,
      legalBoardReviewRequired: false,
      leastPrivilegeRequired: false,
      recommendedAction: "freeze-payment-before-dual-approval",
    },
  ],
  [
    "legal-board-channel-review",
    {
      verificationPolicyKey: "legal-board-channel-review",
      title: "法务与董事会固定通道复核",
      verificationApplied: true,
      authorityContextBias: false,
      trustedChannelRequired: true,
      paymentFreezeRequired: true,
      legalBoardReviewRequired: true,
      leastPrivilegeRequired: false,
      recommendedAction: "restore-legal-board-channel-before-action",
    },
  ],
  [
    "least-privilege-data-room",
    {
      verificationPolicyKey: "least-privilege-data-room",
      title: "资料室最小授权复核",
      verificationApplied: true,
      authorityContextBias: false,
      trustedChannelRequired: true,
      paymentFreezeRequired: false,
      legalBoardReviewRequired: false,
      leastPrivilegeRequired: true,
      recommendedAction: "limit-data-room-scope-expiry-and-review",
    },
  ],
  [
    "freeze-and-escalate",
    {
      verificationPolicyKey: "freeze-and-escalate",
      title: "冻结并升级复盘",
      verificationApplied: true,
      authorityContextBias: false,
      trustedChannelRequired: true,
      paymentFreezeRequired: true,
      legalBoardReviewRequired: true,
      leastPrivilegeRequired: true,
      recommendedAction: "freeze-escalate-and-recap",
    },
  ],
]);

function isCaseKey(value: string): value is WhalingCaseKey {
  return whalingCases.has(value as WhalingCaseKey);
}

function isVerificationPolicyKey(
  value: string,
): value is WhalingVerificationPolicyKey {
  return verificationPolicies.has(value as WhalingVerificationPolicyKey);
}

function createCaseSummary(
  definition: WhalingCaseDefinition,
): WhalingCaseSummary {
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
  definition: WhalingCaseDefinition | null;
  policy: WhalingVerificationPolicyDefinition | null;
}): WhalingAssessment {
  return {
    caseAllowed: input.caseAllowed,
    policyAllowed: input.policyAllowed,
    riskIndicatorCount: input.definition?.riskIndicators.length ?? 0,
    riskIndicators: input.definition?.riskIndicators ?? [],
    matchedControlledCase: Boolean(input.definition),
    authorityContextBias: Boolean(input.policy?.authorityContextBias),
    verificationApplied: Boolean(input.policy?.verificationApplied),
    trustedChannelRequired: Boolean(input.policy?.trustedChannelRequired),
    paymentFreezeRequired: Boolean(input.policy?.paymentFreezeRequired),
    legalBoardReviewRequired: Boolean(input.policy?.legalBoardReviewRequired),
    leastPrivilegeRequired: Boolean(input.policy?.leastPrivilegeRequired),
    recommendedAction:
      input.policy?.recommendedAction ??
      input.definition?.recommendedAction ??
      "blocked-unregistered-whaling-case",
    riskLevel: input.definition?.riskLevel ?? "high",
  };
}

function createBlockedBoundaryResult(input: {
  variantKey: WhalingVariantKey;
  caseKey: string;
  verificationPolicyKey: string;
  blockedReason: string;
}): WhalingResult {
  const safeCaseKey = isCaseKey(input.caseKey) ? input.caseKey : "blocked-case";
  const safeVerificationPolicyKey = isVerificationPolicyKey(
    input.verificationPolicyKey,
  )
    ? input.verificationPolicyKey
    : "blocked-verification-policy";
  const definition = isCaseKey(input.caseKey)
    ? whalingCases.get(input.caseKey) ?? null
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
    signal: "whaling-boundary-verified",
    decision: "blocked",
    message:
      "该捕鲸攻击固定案例或核验策略不在允许列表中，未处理任何真实人员、组织、付款、链接、附件或正文。",
    nextStep: "只选择文档列出的固定 caseKey 和 verificationPolicyKey。",
    blockedReason: input.blockedReason,
  };
}

function resolveSignal(input: {
  variantKey: WhalingVariantKey;
  definition: WhalingCaseDefinition;
  policy: WhalingVerificationPolicyDefinition;
}): WhalingSignal {
  if (input.variantKey === "fixed") {
    if (input.policy.paymentFreezeRequired) {
      return "whaling-payment-freeze-required";
    }

    return "whaling-boundary-verified";
  }

  if (
    input.definition.riskIndicators.includes("executive-authority-pressure")
  ) {
    return "whaling-executive-authority-overweighted";
  }

  return "whaling-confidential-pressure-identified";
}

function createMessage(input: {
  signal: WhalingSignal;
  variantKey: WhalingVariantKey;
}) {
  if (input.signal === "whaling-confidential-pressure-identified") {
    return "漏洞版过度相信高权威和保密语境，固定案例中的高风险流程缺口被错误放行。";
  }

  if (input.signal === "whaling-executive-authority-overweighted") {
    return "漏洞版只看高层授权标签，忽略了可信通道、审批链和最小授权核验。";
  }

  if (input.signal === "whaling-payment-freeze-required") {
    return "修复版要求冻结高风险动作并完成付款、法务或董事会固定通道复核，已阻断固定高风险请求。";
  }

  return "固定案例边界已校验，服务不会处理真实人员、组织、付款、链接、附件或外部目标。";
}

function createNextStep(input: {
  signal: WhalingSignal;
  variantKey: WhalingVariantKey;
}) {
  if (input.variantKey === "vuln") {
    return "使用同一固定案例切换到修复版，观察可信通道、例外冻结和双人复核如何改变判定。";
  }

  if (input.signal === "whaling-payment-freeze-required") {
    return "复盘事件日志中的固定 key、风险类别、建议动作和学习信号，确认没有保存真实业务材料。";
  }

  return "继续检查固定案例是否只使用虚构角色标签和安全摘要。";
}

export function createWhalingLabService(): WhalingLabService {
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

      const definition = whalingCases.get(caseKey);
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
          ? { blockedReason: "whaling-verification-required" }
          : {}),
      };
    },
  };
}
