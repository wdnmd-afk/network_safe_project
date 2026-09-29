import type {
  AuditAction,
  EventActorPerspective,
  EventDecision,
  EventPhase,
  EventRiskLevel,
} from "@nsm/shared";

const riskLabels: Record<EventRiskLevel, string> = {
  critical: "严重",
  high: "高",
  medium: "中",
  low: "低",
};

const decisionLabels: Record<EventDecision, string> = {
  accepted: "已接受",
  blocked: "已阻断",
  failed: "失败",
};

const phaseLabels: Record<EventPhase, string> = {
  attack: "攻击阶段",
  defense: "防御阶段",
  normal: "正常流程",
};

const perspectiveLabels: Record<EventActorPerspective, string> = {
  attacker: "攻击者视角",
  user: "用户视角",
  system: "系统视角",
};

const auditActionLabels: Record<AuditAction, string> = {
  "auth.login.success": "登录成功",
  "auth.login.failure": "登录失败",
  "lab.enable": "启用实验",
  "lab.disable": "停用实验",
  "variant.enable": "启用变体",
  "variant.disable": "停用变体",
};

// 风险与结果既给颜色也给文案，不使用「只用颜色区分」的表达
const riskBadgeClasses: Record<EventRiskLevel, string> = {
  critical: "badge badge-danger",
  high: "badge badge-danger",
  medium: "badge badge-warning",
  low: "badge",
};

const decisionBadgeClasses: Record<EventDecision, string> = {
  accepted: "badge badge-accent",
  blocked: "badge badge-success",
  failed: "badge badge-danger",
};

export function riskLabel(risk: EventRiskLevel) {
  return riskLabels[risk] ?? risk;
}

export function decisionLabel(decision: EventDecision) {
  return decisionLabels[decision] ?? decision;
}

export function phaseLabel(phase: EventPhase) {
  return phaseLabels[phase] ?? phase;
}

export function perspectiveLabel(perspective: EventActorPerspective) {
  return perspectiveLabels[perspective] ?? perspective;
}

export function auditActionLabel(action: AuditAction) {
  return auditActionLabels[action] ?? action;
}

export function riskBadgeClass(risk: EventRiskLevel) {
  return riskBadgeClasses[risk] ?? "badge";
}

export function decisionBadgeClass(decision: EventDecision) {
  return decisionBadgeClasses[decision] ?? "badge";
}

/** 非法或空值统一显示为 —，避免界面出现 Invalid Date */
export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return "—";
  }

  return new Date(timestamp).toLocaleString("zh-CN", { hour12: false });
}

export function formatDuration(durationMs: number | null | undefined) {
  if (durationMs === null || durationMs === undefined || !Number.isFinite(durationMs)) {
    return "—";
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  if (durationMs < 60_000) {
    return `${(durationMs / 1000).toFixed(2)} s`;
  }

  return `${(durationMs / 60_000).toFixed(1)} min`;
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${value}%`;
}

export function formatCount(value: number) {
  return value.toLocaleString("zh-CN");
}
