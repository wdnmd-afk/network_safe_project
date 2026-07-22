import type { LabMetadata } from "@network-safe/shared/lab-metadata";

import { prisma } from "../lib/prisma.js";

export type LabCategoryProfile = {
  code: string;
  name: string;
  description: string;
};

export type LabCategorySyncInput = LabCategoryProfile & {
  sortOrder: number;
};

export type LabSyncInput = {
  labKey: string;
  slug: string;
  title: string;
  categoryId: bigint;
  subcategoryCode: string;
  mode: string;
  severity: string;
  difficulty: string;
  summary: string;
  status: string;
  phase: string;
  sortOrder: number;
  estimatedMinutes: number;
  metaPath: string;
  readmePath: string;
  rootPath: string;
  isEnabled: boolean;
};

export type LabVariantSyncInput = {
  labId: bigint;
  variantKey: string;
  title: string;
  description: string;
  entryKey: string;
  expectedOutcome: string;
  supportsAutomation: boolean;
  isEnabled: boolean;
};

export type LabMetadataSyncRepository = {
  upsertCategory(input: LabCategorySyncInput): Promise<{ id: bigint }>;
  upsertLab(input: LabSyncInput): Promise<{ id: bigint }>;
  upsertVariant(input: LabVariantSyncInput): Promise<void>;
};

export type LabMetadataSyncResult = {
  categories: number;
  labs: number;
  variants: number;
};

const categoryProfiles: Record<string, LabCategoryProfile> = {
  web: {
    code: "web",
    name: "Web 漏洞",
    description: "Web 漏洞靶场实验",
  },
  auth: {
    code: "auth",
    name: "认证授权",
    description: "认证授权与业务逻辑实验",
  },
  network: {
    code: "network",
    name: "网络与传输层",
    description: "虚拟网络拓扑与传输安全模拟实验",
  },
  social: {
    code: "social",
    name: "社会工程学",
    description: "固定虚构案例与防御流程复盘实验",
  },
  malware: {
    code: "malware",
    name: "恶意软件",
    description: "恶意行为时间线与防御策略案例实验",
  },
  "supply-chain": {
    code: "supply-chain",
    name: "供应链",
    description: "依赖、更新与来源完整性学习实验",
  },
  ai: {
    code: "ai",
    name: "AI 与新型攻击",
    description: "确定性 AI 风险案例与资源模拟实验",
  },
  client: {
    code: "client",
    name: "客户端攻击",
    description: "固定浏览器行为与客户端防护实验",
  },
  infrastructure: {
    code: "infrastructure",
    name: "基础设施",
    description: "固定配置、资产和运行边界模拟实验",
  },
};

export function getLabCategoryProfile(category: string): LabCategoryProfile {
  return (
    categoryProfiles[category] ?? {
      code: category,
      name: category,
      description: `${category} 实验分类`,
    }
  );
}

function getMetadataNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function createPrismaLabMetadataSyncRepository(): LabMetadataSyncRepository {
  return {
    async upsertCategory(input) {
      const category = await prisma.labCategory.upsert({
        where: {
          code: input.code,
        },
        update: {
          name: input.name,
          description: input.description,
          sortOrder: input.sortOrder,
        },
        create: {
          code: input.code,
          name: input.name,
          description: input.description,
          sortOrder: input.sortOrder,
        },
        select: {
          id: true,
        },
      });

      return category;
    },

    async upsertLab(input) {
      const lab = await prisma.lab.upsert({
        where: {
          labKey: input.labKey,
        },
        update: {
          slug: input.slug,
          title: input.title,
          categoryId: input.categoryId,
          subcategoryCode: input.subcategoryCode,
          mode: input.mode,
          severity: input.severity,
          difficulty: input.difficulty,
          summary: input.summary,
          status: input.status,
          phase: input.phase,
          sortOrder: input.sortOrder,
          estimatedMinutes: input.estimatedMinutes,
          metaPath: input.metaPath,
          readmePath: input.readmePath,
          rootPath: input.rootPath,
          isEnabled: input.isEnabled,
        },
        create: {
          labKey: input.labKey,
          slug: input.slug,
          title: input.title,
          categoryId: input.categoryId,
          subcategoryCode: input.subcategoryCode,
          mode: input.mode,
          severity: input.severity,
          difficulty: input.difficulty,
          summary: input.summary,
          status: input.status,
          phase: input.phase,
          sortOrder: input.sortOrder,
          estimatedMinutes: input.estimatedMinutes,
          metaPath: input.metaPath,
          readmePath: input.readmePath,
          rootPath: input.rootPath,
          isEnabled: input.isEnabled,
        },
        select: {
          id: true,
        },
      });

      return lab;
    },

    async upsertVariant(input) {
      await prisma.labVariant.upsert({
        where: {
          labId_variantKey: {
            labId: input.labId,
            variantKey: input.variantKey,
          },
        },
        update: {
          title: input.title,
          description: input.description,
          entryKey: input.entryKey,
          expectedOutcome: input.expectedOutcome,
          supportsAutomation: input.supportsAutomation,
          isEnabled: input.isEnabled,
        },
        create: {
          labId: input.labId,
          variantKey: input.variantKey,
          title: input.title,
          description: input.description,
          entryKey: input.entryKey,
          expectedOutcome: input.expectedOutcome,
          supportsAutomation: input.supportsAutomation,
          isEnabled: input.isEnabled,
        },
      });
    },
  };
}

export async function syncLabMetadataToDatabase(
  labs: LabMetadata[],
  repository: LabMetadataSyncRepository = createPrismaLabMetadataSyncRepository(),
): Promise<LabMetadataSyncResult> {
  const categoryIds = new Map<string, bigint>();
  const result: LabMetadataSyncResult = {
    categories: 0,
    labs: 0,
    variants: 0,
  };

  for (const metadata of labs) {
    let categoryId = categoryIds.get(metadata.category);

    if (!categoryId) {
      const profile = getLabCategoryProfile(metadata.category);
      const category = await repository.upsertCategory({
        ...profile,
        sortOrder: 0,
      });

      categoryId = category.id;
      categoryIds.set(metadata.category, categoryId);
      result.categories += 1;
    }

    const lab = await repository.upsertLab({
      labKey: metadata.id,
      slug: metadata.slug,
      title: metadata.title,
      categoryId,
      subcategoryCode: metadata.subcategory,
      mode: metadata.mode,
      severity: metadata.severity,
      difficulty: metadata.difficulty,
      summary: metadata.summary,
      status: metadata.status,
      phase: metadata.phase ?? "",
      sortOrder: getMetadataNumber(metadata.sortOrder),
      estimatedMinutes: getMetadataNumber(metadata.estimatedMinutes),
      metaPath: `${metadata.paths.root}/meta.json`,
      readmePath: metadata.paths.readme,
      rootPath: metadata.paths.root,
      isEnabled: metadata.status !== "deprecated",
    });

    result.labs += 1;

    for (const variant of metadata.variants) {
      await repository.upsertVariant({
        labId: lab.id,
        variantKey: variant.key,
        title: variant.title,
        description: variant.description,
        entryKey: variant.entryKey,
        expectedOutcome: variant.expectedOutcome,
        supportsAutomation: variant.supportsAutomation,
        isEnabled: variant.enabled,
      });
      result.variants += 1;
    }
  }

  return result;
}
