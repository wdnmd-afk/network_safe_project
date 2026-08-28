import {
  createControlledDecisionLabService,
  type ControlledDecisionLabService,
  type ControlledResult,
  type ControlledVariantKey,
} from "./controlled-decision-lab.js";

export type PropertyAuthorizationVariantKey = ControlledVariantKey;
export const propertyAuthorizationScenarioKey = "fixed-profile-update-dto";
export const propertyAuthorizationRiskSignal = "api-property-authorization-risk-accepted";
export const propertyAuthorizationDefenseSignal = "api-property-authorization-defense-blocked";
export const propertyAuthorizationNormalSignal = "api-property-authorization-normal-verified";
export const propertyAuthorizationBoundarySignal = "api-property-authorization-boundary-blocked";

const definition = {
  id: "api.property-authorization",
  slug: "property-authorization",
  category: "api",
  subcategory: "property-authorization",
  title: "API 属性级授权与批量绑定",
  mode: "interactive",
  severity: "high",
  difficulty: "advanced",
  summary: "通过固定 DTO 字段快照对比客户端字段全量绑定与服务端所有权校验。",
  scenarioKey: propertyAuthorizationScenarioKey,
  caseTitle: "固定资料更新 DTO",
  caseDescription: "客户端同时提交可编辑资料和服务端所有权字段，观察字段允许列表与批量绑定风险。",
  evidence: [
    { key: "editable-display-name", title: "displayName · user-editable", detail: "客户端固定值：演示用户-更新；允许列表可放行。" },
    { key: "server-owned-role", title: "role · server-owned", detail: "客户端固定值：admin；服务端固定值：member。" },
    { key: "server-owned-status", title: "status · server-owned", detail: "客户端固定值：active；服务端继续管理状态。" },
    { key: "server-owned-account-limit", title: "accountLimit · server-owned", detail: "客户端固定值：9999；服务端固定值：100。" },
  ],
  steps: [
    {
      key: "binding-policy",
      order: 1,
      title: "DTO 绑定策略",
      prompt: "选择固定资料更新 DTO 的字段绑定策略。",
      options: [
        { key: "bind-all-client-fields", label: "绑定客户端全部字段（漏洞视角）", outcome: "risk", decision: "accepted", signal: "api-property-authorization-binding-open", explanation: "全量绑定把 role、status 和 accountLimit 等服务端字段暴露给客户端。" },
        { key: "enforce-field-allowlist-and-server-ownership", label: "启用字段允许列表与服务端所有权", outcome: "fix", decision: "blocked", signal: "api-property-authorization-binding-enforced", explanation: "服务端仅接受允许列表字段，并为服务端所有权字段保留固定值。" },
      ],
    },
    {
      key: "property-disposition",
      order: 2,
      title: "字段更新处置",
      prompt: "选择当前绑定策略下的固定字段更新结果。",
      options: [
        { key: "persist-server-owned-fields", label: "持久化客户端提交的服务端字段（漏洞视角）", outcome: "risk", decision: "accepted", signal: propertyAuthorizationRiskSignal, explanation: "漏洞版接受批量绑定字段，客户端提交的 role 和 accountLimit 进入固定更新摘要。" },
        { key: "block-server-owned-field-update", label: "阻断服务端字段更新", outcome: "fix", decision: "blocked", signal: propertyAuthorizationDefenseSignal, explanation: "修复版阻断服务端所有权字段更新，仅保留固定允许列表。" },
        { key: "allow-display-name-update", label: "仅放行 displayName 更新", outcome: "normal", decision: "accepted", signal: propertyAuthorizationNormalSignal, explanation: "修复版保留正常资料更新路径，displayName 可以在服务端规则下继续修改。" },
      ],
    },
  ],
  safeBoundaries: ["只使用固定 DTO 字段快照，不接受真实用户 ID、角色、金额或自由 JSON。", "页面和 API 只接受固定 scenarioKey 与 optionKey。", "未知 key 会被脱敏阻断，不写入原始输入。"],
  notes: "该实验只模拟属性级授权与批量绑定，不修改真实用户或数据库字段。",
  signals: { risk: propertyAuthorizationRiskSignal, defense: propertyAuthorizationDefenseSignal, normal: propertyAuthorizationNormalSignal, boundary: propertyAuthorizationBoundarySignal },
  paths: {
    risk: ["bind-all-client-fields", "persist-server-owned-fields"],
    defense: ["enforce-field-allowlist-and-server-ownership", "block-server-owned-field-update"],
    normal: ["enforce-field-allowlist-and-server-ownership", "allow-display-name-update"],
  },
} as const;

export type PropertyAuthorizationWorkbench = ReturnType<
  ControlledDecisionLabService["getWorkbench"]
>;
export type PropertyAuthorizationEvaluationResult = ControlledResult;
export const service = createControlledDecisionLabService(definition);
export function createPropertyAuthorizationLabService() {
  return service;
}
