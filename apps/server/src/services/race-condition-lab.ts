import {
  createControlledDecisionLabService,
  type ControlledDecisionLabService,
  type ControlledResult,
  type ControlledVariantKey,
} from "./controlled-decision-lab.js";

export type RaceConditionVariantKey = ControlledVariantKey;
export const raceConditionScenarioKey = "fixed-single-stock-double-request";
export const raceConditionRiskSignal = "business-logic-race-condition-risk-accepted";
export const raceConditionDefenseSignal = "business-logic-race-condition-defense-blocked";
export const raceConditionNormalSignal = "business-logic-race-condition-normal-verified";
export const raceConditionBoundarySignal = "business-logic-race-condition-boundary-blocked";

const definition = {
  id: "business-logic.race-condition",
  slug: "race-condition",
  category: "business-logic",
  subcategory: "race-condition",
  title: "业务竞态与幂等",
  mode: "simulation",
  severity: "high",
  difficulty: "advanced",
  summary: "通过固定单库存双请求快照观察无锁读写、幂等键和版本校验的差异。",
  scenarioKey: raceConditionScenarioKey,
  caseTitle: "固定单库存双请求",
  caseDescription: "两个固定请求读取同一库存版本，观察重复扣减与幂等保护的教学结果。",
  evidence: [
    { key: "single-stock", title: "库存基线", detail: "virtual-limited-stock-item 初始库存为 1。" },
    { key: "shared-version", title: "共享版本", detail: "两个请求均读取固定版本 7。" },
    { key: "request-a", title: "固定请求 A", detail: "unique-action-a / expected-version-7 / decrement-1。" },
    { key: "request-b", title: "固定请求 B", detail: "duplicate-or-stale-b / expected-version-7 / decrement-1。" },
  ],
  steps: [
    {
      key: "concurrency-policy",
      order: 1,
      title: "并发控制策略",
      prompt: "选择固定双请求扣减的并发控制策略。",
      options: [
        { key: "read-then-write-without-version", label: "无版本校验直接读写（漏洞视角）", outcome: "risk", decision: "accepted", signal: "business-logic-race-condition-control-open", explanation: "两个请求都基于旧版本继续写入，固定库存缺少并发约束。" },
        { key: "enforce-idempotency-and-version-check", label: "启用幂等键与版本校验", outcome: "fix", decision: "blocked", signal: "business-logic-race-condition-control-enforced", explanation: "服务端使用固定幂等和版本策略识别重复或陈旧请求。" },
      ],
    },
    {
      key: "request-disposition",
      order: 2,
      title: "双请求处置",
      prompt: "选择当前策略下的固定请求结果。",
      options: [
        { key: "accept-both-stock-decrements", label: "接受两次库存扣减（漏洞视角）", outcome: "risk", decision: "accepted", signal: raceConditionRiskSignal, explanation: "漏洞版产生固定双扣摘要，库存从 1 被错误计算为 -1。" },
        { key: "block-duplicate-or-stale-request", label: "阻断重复或陈旧请求", outcome: "fix", decision: "blocked", signal: raceConditionDefenseSignal, explanation: "修复版阻断第二个重复或陈旧请求，不执行真实并发操作。" },
        { key: "allow-single-unique-request", label: "只放行一次唯一请求", outcome: "normal", decision: "accepted", signal: raceConditionNormalSignal, explanation: "修复版保留单次唯一请求的正常扣减路径。" },
      ],
    },
  ],
  safeBoundaries: ["只使用固定库存、版本和请求摘要，不接受商品 ID、金额、库存或幂等值。", "不发起真实并发、不操作数据库事务或真实资金。", "未知 key 会被脱敏阻断。"],
  notes: "该实验只模拟竞态与幂等决策，不提供并发压测或重放工具。",
  signals: { risk: raceConditionRiskSignal, defense: raceConditionDefenseSignal, normal: raceConditionNormalSignal, boundary: raceConditionBoundarySignal },
} as const;

export type RaceConditionWorkbench = ReturnType<
  ControlledDecisionLabService["getWorkbench"]
>;
export type RaceConditionEvaluationResult = ControlledResult;
export const service = createControlledDecisionLabService(definition);
export function createRaceConditionLabService() {
  return service;
}
