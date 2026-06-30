import type {
  LdapInjectionResult,
  LdapInjectionScenarioKey,
  LdapInjectionSignal as LdapInjectionApiSignal,
  LdapInjectionVariantKey,
} from "../api/ldap-injection-lab";

export type { LdapInjectionScenarioKey, LdapInjectionVariantKey };

export type LdapInjectionSignal =
  | LdapInjectionApiSignal
  | "ldap-injection-case-study-reviewed"
  | "ldap-injection-filter-template-reviewed"
  | "ldap-injection-boundary-verified";

export type LdapInjectionVariantConfig = {
  key: LdapInjectionVariantKey;
  title: string;
  badge: string;
  perspective: string;
  explanation: string;
  expectedSignal: string;
  expectedOutcome: string;
  panelIntro: string;
};

export type LdapInjectionCaseStudy = {
  key: LdapInjectionScenarioKey;
  title: string;
  businessGoal: string;
  attackerQuestion: string;
  vulnerableObservation: string;
  fixedObservation: string;
};

export type LdapInjectionCaseStudyRow = {
  key: LdapInjectionScenarioKey;
  title: string;
  businessGoal: string;
  focus: string;
  observation: string;
};

export type LdapInjectionReviewChecklistItem = {
  key: string;
  title: string;
  description: string;
};

export type LdapInjectionLearningProgressInput = {
  variantKey: LdapInjectionVariantKey;
  status: "in-progress";
  notes: string;
};

export type LdapInjectionVerificationRecordInput = {
  variantKey: LdapInjectionVariantKey;
  result: "passed";
  summary: string;
  details: {
    signal: LdapInjectionApiSignal;
    scenarioKey: string;
    resultScope: string;
    detectedRiskTypes: string[];
    matchedControlledSample: boolean;
    entryCount: number;
  };
};

export const normalLdapInjectionScenarioKey = "member-search";
export const normalLdapInjectionKeyword = "alice";
export const attackLdapInjectionKeyword =
  "LAB_CONTROLLED_LDAP:expand-directory-scope";

const ldapInjectionVariantConfigs: Record<
  LdapInjectionVariantKey,
  LdapInjectionVariantConfig
> = {
  vuln: {
    key: "vuln",
    title: "LDAP 注入漏洞版",
    badge: "虚拟目录查询器会接受固定受控样例",
    perspective: "攻击方观察",
    explanation:
      "本页从攻击方视角观察组织成员搜索、权限组查询和登录筛选中，用户输入影响目录查询语义后的风险。",
    expectedSignal:
      "提交受控 LDAP 样例后应出现 ldap-injection-scope-expanded 信号。",
    expectedOutcome: "完成固定场景、正常关键词和受控样例的结果范围观察。",
    panelIntro:
      "工作台只调用本项目虚拟目录 API，不提供真实目录连接、过滤器字符串或外部目标。",
  },
  fixed: {
    key: "fixed",
    title: "LDAP 注入修复版",
    badge: "服务端固定场景、文本值边界和目录账号最小权限",
    perspective: "防御方复盘",
    explanation:
      "本页从防御方视角复盘同样案例，观察服务端固定查询场景、文本值处理和审计策略如何收紧边界。",
    expectedSignal:
      "提交受控 LDAP 样例后应出现 ldap-injection-controlled-sample-blocked 信号。",
    expectedOutcome: "完成模板化、输入边界、权限边界和审计要点复盘。",
    panelIntro:
      "修复案例强调服务端边界，前端限制只能改善体验，不能作为 LDAP 注入防护的根本依据。",
  },
};

export const ldapInjectionCaseStudies: LdapInjectionCaseStudy[] = [
  {
    key: "member-search",
    title: "组织成员搜索",
    businessGoal: "用户按姓名关键词搜索当前组织成员。",
    attackerQuestion: "姓名关键词是否能影响组织范围条件，导致结果越过当前组织边界？",
    vulnerableObservation:
      "漏洞案例中，关键词被当成查询语义的一部分，学习重点是观察结果范围为什么偏离当前组织。",
    fixedObservation:
      "修复案例中，组织范围由服务端固定，关键词只作为文本值进入模板，学习重点是观察边界不再由输入决定。",
  },
  {
    key: "group-lookup",
    title: "权限组查询",
    businessGoal: "用户按组名查找自己允许查看的权限组。",
    attackerQuestion: "组名输入是否能影响权限范围条件，暴露本不应出现的组信息？",
    vulnerableObservation:
      "漏洞案例中，组名输入可能改变可见范围判断，学习重点是识别客户端输入不应决定权限边界。",
    fixedObservation:
      "修复案例中，角色范围、字段允许列表和查询模板都由服务端控制，学习重点是观察权限约束始终独立存在。",
  },
  {
    key: "login-filter",
    title: "登录筛选案例",
    businessGoal: "登录流程按用户名定位候选用户，再进入独立凭据校验。",
    attackerQuestion: "用户名定位是否依赖可拼接查询，进而影响候选用户选择？",
    vulnerableObservation:
      "漏洞案例中，候选用户定位可能被输入语义干扰，学习重点是观察认证流程为什么不能信任可拼接查询。",
    fixedObservation:
      "修复案例中，用户名定位使用固定模板，凭据校验、失败计数和审计独立执行，学习重点是观察认证链路分层。",
  },
];

export const ldapInjectionScenarioOptions = ldapInjectionCaseStudies.map(
  (caseStudy) => ({
    key: caseStudy.key,
    title: caseStudy.title,
  }),
);

export const ldapInjectionReviewChecklist: LdapInjectionReviewChecklistItem[] =
  [
    {
      key: "template",
      title: "查询结构由服务端固定",
      description:
        "客户端只能提交业务字段值，不能提交目录过滤结构、查询范围或权限判断条件。",
    },
    {
      key: "escaping",
      title: "文本值进入专用转义流程",
      description:
        "用户输入在进入目录查询上下文前必须按 LDAP 过滤语义处理，不能直接拼入查询条件。",
    },
    {
      key: "least-privilege",
      title: "目录账号保持最小权限",
      description:
        "即使查询条件出现问题，目录账号也不应具备读取敏感组织结构或越权数据的能力。",
    },
    {
      key: "audit",
      title: "审计只记录学习摘要",
      description:
        "日志应记录案例 key、视角、决策和学习信号，不保存完整危险输入、目录账号或外部目标信息。",
    },
  ];

export function getLdapInjectionVariantConfig(
  variant: LdapInjectionVariantKey,
) {
  return ldapInjectionVariantConfigs[variant];
}

export function getLdapInjectionCaseStudyRows(
  variant: LdapInjectionVariantKey,
): LdapInjectionCaseStudyRow[] {
  return ldapInjectionCaseStudies.map((caseStudy) => ({
    key: caseStudy.key,
    title: caseStudy.title,
    businessGoal: caseStudy.businessGoal,
    focus:
      variant === "vuln"
        ? caseStudy.attackerQuestion
        : "修复版如何把业务约束固定在服务端，并把输入限制为普通文本值？",
    observation:
      variant === "vuln"
        ? caseStudy.vulnerableObservation
        : caseStudy.fixedObservation,
  }));
}

export function createLdapInjectionLearningProgress(
  config: LdapInjectionVariantConfig,
): LdapInjectionLearningProgressInput {
  return {
    variantKey: config.key,
    status: "in-progress",
    notes: `进入 ${config.title}`,
  };
}

export function createLdapInjectionVerificationRecord(
  config: LdapInjectionVariantConfig,
  result: LdapInjectionResult,
): LdapInjectionVerificationRecordInput {
  const details = {
    signal: result.signal,
    scenarioKey: result.scenarioKey,
    resultScope: result.inspection.resultScope,
    detectedRiskTypes: result.inspection.detectedRiskTypes,
    matchedControlledSample: result.inspection.matchedControlledSample,
    entryCount: result.entries.length,
  };

  if (config.key === "vuln") {
    return {
      variantKey: config.key,
      result: "passed",
      summary: "漏洞版接受受控 LDAP 样例，并展示虚拟目录结果范围扩大信号。",
      details,
    };
  }

  return {
    variantKey: config.key,
    result: "passed",
    summary: "修复版检测到受控 LDAP 样例，并通过服务端固定查询场景阻断请求。",
    details,
  };
}

export function formatLdapInjectionSignal(signal: LdapInjectionSignal) {
  const labels: Record<LdapInjectionSignal, string> = {
    "ldap-injection-case-study-reviewed": "已完成漏洞案例观察",
    "ldap-injection-filter-template-reviewed": "已完成过滤模板防护复盘",
    "ldap-injection-boundary-verified": "已确认案例化安全边界",
    "ldap-injection-safe-search-completed": "虚拟目录查询正常完成",
    "ldap-injection-scope-expanded": "漏洞版虚拟目录结果范围被扩大",
    "ldap-injection-controlled-sample-blocked": "修复版阻断受控 LDAP 样例",
    "ldap-injection-input-blocked": "超出受控范围的 LDAP 输入已阻断",
    "ldap-injection-template-not-found": "目录查询场景不在允许列表",
  };

  return labels[signal];
}
