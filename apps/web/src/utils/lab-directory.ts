import type { LabMetadata } from "../api/labs";

import { guidedScenarioCatalog } from "@network-safe/shared/guided-scenarios";

export type LabDepth = "D2" | "D3" | "D4";

export type LabDirectoryFilters = {
  query: string;
  category: string;
  difficulty: string;
  mode: string;
  severity: string;
  depth: string;
};

export type LabFilterOptions = {
  categories: string[];
  difficulties: string[];
  modes: string[];
  severities: string[];
  depths: LabDepth[];
};

export type LearningPathLevel = "beginner" | "intermediate" | "advanced";

export type LearningPathDefinition = {
  id: string;
  title: string;
  description: string;
  level: LearningPathLevel;
  labIds: readonly string[];
};

export type LearningPathContext = {
  path: LearningPathDefinition;
  position: number;
  previousLabId?: string;
  nextLabId?: string;
};

const guidedScenarioIds = new Set(
  guidedScenarioCatalog.map((scenario) => scenario.id),
);

export const learningPaths: readonly LearningPathDefinition[] = [
  {
    id: "web-foundations",
    title: "Web 应用基础",
    description: "从输入输出、请求伪造到服务端查询和资源边界，建立 Web 防御基础。",
    level: "beginner",
    labIds: [
      "web.xss",
      "web.csrf",
      "web.sql-injection",
      "web.file-upload",
      "web.ssrf",
    ],
  },
  {
    id: "identity-and-access",
    title: "认证与访问控制",
    description: "按会话、令牌、对象权限和功能权限顺序理解身份边界。",
    level: "intermediate",
    labIds: [
      "auth.brute-force",
      "auth.session-fixation",
      "auth.jwt",
      "auth.idor",
      "auth.privilege-escalation",
      "api.functional-authorization",
    ],
  },
  {
    id: "network-defense",
    title: "网络防御基础",
    description: "从资产暴露和解析完整性开始，逐步观察网络容量与传输边界。",
    level: "intermediate",
    labIds: ["network.port-scan", "network.dns-hijack", "network.mitm", "network.ddos"],
  },
  {
    id: "supply-chain-integrity",
    title: "供应链完整性",
    description: "围绕依赖来源、更新过程和制品信任链建立审计视角。",
    level: "intermediate",
    labIds: [
      "supply-chain.dependency-confusion",
      "supply-chain.malicious-package",
      "supply-chain.update-poisoning",
    ],
  },
  {
    id: "ai-trust-boundaries",
    title: "AI 信任边界",
    description: "从 Prompt 边界到合成媒体与模型输入，建立固定案例研判路径。",
    level: "advanced",
    labIds: ["ai.prompt-injection", "ai.deepfake", "ai.adversarial-ai"],
  },
];

export function deriveLabDepth(lab: Pick<LabMetadata, "id" | "mode">): LabDepth {
  if (guidedScenarioIds.has(lab.id)) {
    return "D2";
  }

  return lab.mode === "interactive" ? "D4" : "D3";
}

export function createDefaultLabDirectoryFilters(): LabDirectoryFilters {
  return {
    query: "",
    category: "all",
    difficulty: "all",
    mode: "all",
    severity: "all",
    depth: "all",
  };
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function getLabFilterOptions(labs: readonly LabMetadata[]): LabFilterOptions {
  return {
    categories: uniqueSorted(labs.map((lab) => lab.category)),
    difficulties: uniqueSorted(labs.map((lab) => lab.difficulty)),
    modes: uniqueSorted(labs.map((lab) => lab.mode)),
    severities: uniqueSorted(labs.map((lab) => lab.severity)),
    depths: ["D2", "D3", "D4"].filter((depth) =>
      labs.some((lab) => deriveLabDepth(lab) === depth),
    ) as LabDepth[],
  };
}

function searchableLabText(lab: LabMetadata) {
  return [lab.title, lab.summary, ...lab.tags, ...lab.knowledgePoints]
    .join(" ")
    .toLocaleLowerCase();
}

export function filterLabs(
  labs: readonly LabMetadata[],
  filters: LabDirectoryFilters,
) {
  const query = filters.query.trim().toLocaleLowerCase();

  return labs.filter((lab) => {
    if (filters.category !== "all" && lab.category !== filters.category) {
      return false;
    }
    if (filters.difficulty !== "all" && lab.difficulty !== filters.difficulty) {
      return false;
    }
    if (filters.mode !== "all" && lab.mode !== filters.mode) {
      return false;
    }
    if (filters.severity !== "all" && lab.severity !== filters.severity) {
      return false;
    }
    if (filters.depth !== "all" && deriveLabDepth(lab) !== filters.depth) {
      return false;
    }
    return !query || searchableLabText(lab).includes(query);
  });
}

export function getLearningPathContexts(labId: string): LearningPathContext[] {
  return learningPaths.flatMap((path) => {
    const position = path.labIds.indexOf(labId);

    if (position < 0) {
      return [];
    }

    return [
      {
        path,
        position,
        previousLabId: path.labIds[position - 1],
        nextLabId: path.labIds[position + 1],
      },
    ];
  });
}

export function getLearningPathLabIds() {
  return new Set(learningPaths.flatMap((path) => path.labIds));
}

export function validateLearningPaths(labs: readonly Pick<LabMetadata, "id">[]) {
  const knownLabIds = new Set(labs.map((lab) => lab.id));
  const errors: string[] = [];
  const pathIds = new Set<string>();

  for (const path of learningPaths) {
    if (pathIds.has(path.id)) {
      errors.push(`duplicate learning path id: ${path.id}`);
    }
    pathIds.add(path.id);

    if (path.labIds.length === 0) {
      errors.push(`learning path is empty: ${path.id}`);
    }

    if (new Set(path.labIds).size !== path.labIds.length) {
      errors.push(`learning path contains duplicate labs: ${path.id}`);
    }

    for (const labId of path.labIds) {
      if (!knownLabIds.has(labId)) {
        errors.push(`learning path references unknown lab: ${path.id}/${labId}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
