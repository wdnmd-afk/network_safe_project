import type { LabMetadata } from "../api/labs";
import type { CurrentUserLabEventLogSummary } from "../api/lab-records";

export type LabStatusKey = "planned" | "in-progress" | "ready" | "deprecated";

export type StatusBucket = {
  key: LabStatusKey;
  label: string;
  count: number;
  percent: number;
};

export type CategoryStatusSummary = {
  category: string;
  label: string;
  total: number;
  ready: number;
  inProgress: number;
  planned: number;
  deprecated: number;
  readyPercent: number;
};

export type AutomationCoverageSummary = {
  total: number;
  withPlaywright: number;
  withApiTest: number;
  withScriptVerification: number;
  withAnyAutomation: number;
  fullyCoveredThreeWay: number;
  playwrightPercent: number;
  apiTestPercent: number;
  scriptVerificationPercent: number;
  anyAutomationPercent: number;
};

export type LabReadinessRow = {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  subcategory: string;
  status: LabStatusKey;
  mode: string;
  severity: string;
  difficulty: string;
  variantCount: number;
  webEntryCount: number;
  apiEntryCount: number;
  scriptEntryCount: number;
  docEntryCount: number;
  hasPlaywright: boolean;
  hasApiTest: boolean;
  hasScriptVerification: boolean;
  automationTypes: number;
  detailPath: string;
};

export type EventPhaseSummary = {
  attack: number;
  defense: number;
  normal: number;
};

export type EventRiskSummary = {
  critical: number;
  high: number;
  medium: number;
  low: number;
};

export type EventDecisionSummary = {
  accepted: number;
  blocked: number;
  failed: number;
};

export type LabEventAggregateRow = {
  labKey: string;
  title: string;
  total: number;
  attack: number;
  defense: number;
  normal: number;
  highestRisk: "critical" | "high" | "medium" | "low" | "none";
  lastCreatedAt: string;
};

export type EventStatusSummary = {
  total: number;
  phase: EventPhaseSummary;
  risk: EventRiskSummary;
  decision: EventDecisionSummary;
  byLab: LabEventAggregateRow[];
};

const categoryLabels: Record<string, string> = {
  web: "Web 漏洞",
  auth: "认证授权",
  network: "网络 / 传输层",
  ai: "AI / 新型攻击",
  social: "社会工程学",
  malware: "恶意软件",
  client: "客户端攻击",
  "supply-chain": "供应链",
  infrastructure: "基础设施",
};

const statusLabels: Record<LabStatusKey, string> = {
  planned: "规划中",
  "in-progress": "进行中",
  ready: "已就绪",
  deprecated: "已弃用",
};

const statusOrder: LabStatusKey[] = [
  "ready",
  "in-progress",
  "planned",
  "deprecated",
];

const riskWeight: Record<"critical" | "high" | "medium" | "low", number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function getCategoryLabel(category: string) {
  return categoryLabels[category] ?? category;
}

export function getStatusLabel(status: string) {
  return statusLabels[status as LabStatusKey] ?? status;
}

function toPercent(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function isKnownStatus(status: string): status is LabStatusKey {
  return (
    status === "planned" ||
    status === "in-progress" ||
    status === "ready" ||
    status === "deprecated"
  );
}

export function summarizeStatusBuckets(labs: LabMetadata[]): StatusBucket[] {
  const counts: Record<LabStatusKey, number> = {
    ready: 0,
    "in-progress": 0,
    planned: 0,
    deprecated: 0,
  };

  for (const lab of labs) {
    if (isKnownStatus(lab.status)) {
      counts[lab.status] += 1;
    }
  }

  return statusOrder.map((key) => ({
    key,
    label: statusLabels[key],
    count: counts[key],
    percent: toPercent(counts[key], labs.length),
  }));
}

export function summarizeCategories(
  labs: LabMetadata[],
): CategoryStatusSummary[] {
  const groups = new Map<string, LabMetadata[]>();

  for (const lab of labs) {
    const existing = groups.get(lab.category) ?? [];
    existing.push(lab);
    groups.set(lab.category, existing);
  }

  return [...groups.entries()]
    .map(([category, categoryLabs]) => {
      const ready = categoryLabs.filter((lab) => lab.status === "ready").length;
      const inProgress = categoryLabs.filter(
        (lab) => lab.status === "in-progress",
      ).length;
      const planned = categoryLabs.filter(
        (lab) => lab.status === "planned",
      ).length;
      const deprecated = categoryLabs.filter(
        (lab) => lab.status === "deprecated",
      ).length;

      return {
        category,
        label: getCategoryLabel(category),
        total: categoryLabs.length,
        ready,
        inProgress,
        planned,
        deprecated,
        readyPercent: toPercent(ready, categoryLabs.length),
      };
    })
    .sort((left, right) => right.total - left.total || left.category.localeCompare(right.category));
}

export function summarizeAutomationCoverage(
  labs: LabMetadata[],
): AutomationCoverageSummary {
  let withPlaywright = 0;
  let withApiTest = 0;
  let withScriptVerification = 0;
  let withAnyAutomation = 0;
  let fullyCoveredThreeWay = 0;

  for (const lab of labs) {
    const automation = lab.verification.automation;
    const hasPlaywright = Boolean(automation.playwright?.enabled);
    const hasApiTest = Boolean(automation.apiTest?.enabled);
    const hasScriptVerification = Boolean(
      automation.scriptVerification?.enabled,
    );
    const coveredTypes = [
      hasPlaywright,
      hasApiTest,
      hasScriptVerification,
    ].filter(Boolean).length;

    if (hasPlaywright) {
      withPlaywright += 1;
    }

    if (hasApiTest) {
      withApiTest += 1;
    }

    if (hasScriptVerification) {
      withScriptVerification += 1;
    }

    if (coveredTypes > 0) {
      withAnyAutomation += 1;
    }

    if (coveredTypes === 3) {
      fullyCoveredThreeWay += 1;
    }
  }

  return {
    total: labs.length,
    withPlaywright,
    withApiTest,
    withScriptVerification,
    withAnyAutomation,
    fullyCoveredThreeWay,
    playwrightPercent: toPercent(withPlaywright, labs.length),
    apiTestPercent: toPercent(withApiTest, labs.length),
    scriptVerificationPercent: toPercent(withScriptVerification, labs.length),
    anyAutomationPercent: toPercent(withAnyAutomation, labs.length),
  };
}

export function buildLabReadinessRows(labs: LabMetadata[]): LabReadinessRow[] {
  return labs
    .map((lab) => {
      const automation = lab.verification.automation;
      const hasPlaywright = Boolean(automation.playwright?.enabled);
      const hasApiTest = Boolean(automation.apiTest?.enabled);
      const hasScriptVerification = Boolean(
        automation.scriptVerification?.enabled,
      );

      return {
        id: lab.id,
        title: lab.title,
        category: lab.category,
        categoryLabel: getCategoryLabel(lab.category),
        subcategory: lab.subcategory,
        status: isKnownStatus(lab.status) ? lab.status : "planned",
        mode: lab.mode,
        severity: lab.severity,
        difficulty: lab.difficulty,
        variantCount: lab.variants.length,
        webEntryCount: lab.entrypoints.web.length,
        apiEntryCount: lab.entrypoints.api.length,
        scriptEntryCount: lab.entrypoints.scripts.length,
        docEntryCount: lab.entrypoints.docs.length,
        hasPlaywright,
        hasApiTest,
        hasScriptVerification,
        automationTypes: [
          hasPlaywright,
          hasApiTest,
          hasScriptVerification,
        ].filter(Boolean).length,
        detailPath: `/labs/${lab.category}/${lab.subcategory}`,
      };
    })
    .sort(
      (left, right) =>
        left.categoryLabel.localeCompare(right.categoryLabel) ||
        left.title.localeCompare(right.title),
    );
}

function highestRiskOf(
  events: CurrentUserLabEventLogSummary[],
): LabEventAggregateRow["highestRisk"] {
  let best = 0;

  for (const event of events) {
    best = Math.max(best, riskWeight[event.riskLevel] ?? 0);
  }

  if (best >= 4) {
    return "critical";
  }

  if (best === 3) {
    return "high";
  }

  if (best === 2) {
    return "medium";
  }

  if (best === 1) {
    return "low";
  }

  return "none";
}

export function summarizeEvents(
  events: CurrentUserLabEventLogSummary[],
): EventStatusSummary {
  const phase: EventPhaseSummary = { attack: 0, defense: 0, normal: 0 };
  const risk: EventRiskSummary = { critical: 0, high: 0, medium: 0, low: 0 };
  const decision: EventDecisionSummary = {
    accepted: 0,
    blocked: 0,
    failed: 0,
  };
  const byLabGroups = new Map<string, CurrentUserLabEventLogSummary[]>();

  for (const event of events) {
    phase[event.phase] += 1;
    risk[event.riskLevel] += 1;
    decision[event.decision] += 1;

    const existing = byLabGroups.get(event.labKey) ?? [];
    existing.push(event);
    byLabGroups.set(event.labKey, existing);
  }

  const byLab: LabEventAggregateRow[] = [...byLabGroups.entries()]
    .map(([labKey, labEvents]) => {
      const lastCreatedAt = labEvents
        .map((event) => event.createdAt)
        .sort()
        .at(-1);

      return {
        labKey,
        title: labEvents[0]?.title ?? labKey,
        total: labEvents.length,
        attack: labEvents.filter((event) => event.phase === "attack").length,
        defense: labEvents.filter((event) => event.phase === "defense").length,
        normal: labEvents.filter((event) => event.phase === "normal").length,
        highestRisk: highestRiskOf(labEvents),
        lastCreatedAt: lastCreatedAt ?? "",
      };
    })
    .sort((left, right) => right.total - left.total || left.labKey.localeCompare(right.labKey));

  return {
    total: events.length,
    phase,
    risk,
    decision,
    byLab,
  };
}
