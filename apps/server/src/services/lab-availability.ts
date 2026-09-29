import { prisma } from "../lib/prisma.js";

export type LabAvailabilitySource = "database" | "metadata-fallback";

export type LabAvailabilityRepositoryItem = {
  labKey: string;
  isEnabled: boolean;
  variants: {
    variantKey: string;
    isEnabled: boolean;
  }[];
};

export type LabAvailabilityRepository = {
  findLabAvailability(): Promise<LabAvailabilityRepositoryItem[]>;
};

export type LabAvailabilityLogger = Pick<Console, "warn">;

export type LabAvailabilitySnapshot = {
  source: LabAvailabilitySource;
  /** labKey -> is_enabled；数据库中没有该行时视为启用，不写入这个表 */
  labs: Map<string, boolean>;
  /** `${labKey}:${variantKey}` -> is_enabled；同样只登记数据库真实存在的行 */
  variants: Map<string, boolean>;
};

export type LabAvailabilityService = {
  getSnapshot(): Promise<LabAvailabilitySnapshot>;
};

export function buildVariantAvailabilityKey(labKey: string, variantKey: string) {
  return `${labKey}:${variantKey}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown lab availability error";
}

export function createDefaultLabAvailabilityRepository(): LabAvailabilityRepository {
  return {
    async findLabAvailability() {
      return prisma.lab.findMany({
        select: {
          labKey: true,
          isEnabled: true,
          variants: {
            select: {
              variantKey: true,
              isEnabled: true,
            },
          },
        },
      });
    },
  };
}

/**
 * 实验可用性快照。
 *
 * 与元数据 `variant.enabled` 的区别：`variant.enabled` 是 meta.json 的登记事实，
 * 本快照是管理端在数据库中配置的运行期启停。两者语义不同，不得互相覆写。
 *
 * 数据库不可用时返回空快照并标记 metadata-fallback，调用方按放行处理——
 * 学习平台的可用性优先于管理端配置的强制力。
 */
export function createLabAvailabilityService(
  repository: LabAvailabilityRepository = createDefaultLabAvailabilityRepository(),
  logger: LabAvailabilityLogger = console,
): LabAvailabilityService {
  return {
    async getSnapshot() {
      try {
        const rows = await repository.findLabAvailability();
        const labs = new Map<string, boolean>();
        const variants = new Map<string, boolean>();

        for (const row of rows) {
          labs.set(row.labKey, row.isEnabled);

          for (const variant of row.variants) {
            variants.set(
              buildVariantAvailabilityKey(row.labKey, variant.variantKey),
              variant.isEnabled,
            );
          }
        }

        return {
          source: "database" as const,
          labs,
          variants,
        };
      } catch (error) {
        logger.warn(
          `[LAB_AVAILABILITY_FALLBACK] 读取启停状态失败，按元数据放行 error="${getErrorMessage(error)}"`,
        );

        return {
          source: "metadata-fallback" as const,
          labs: new Map<string, boolean>(),
          variants: new Map<string, boolean>(),
        };
      }
    },
  };
}

export type LabAvailabilityView = {
  source: LabAvailabilitySource;
  labEnabled: boolean;
  variants: {
    key: string;
    enabled: boolean;
  }[];
};

/**
 * 目录响应附带的可用性视图。
 *
 * `variants[].enabled` = 元数据 enabled && 实验级启用 && 变体级启用。
 * 元数据未启用的变体保持 false，管理端无法通过数据库把它"打开"。
 */
export function buildLabAvailabilityView(
  lab: { id: string; variants: { key: string; enabled: boolean }[] },
  snapshot: LabAvailabilitySnapshot,
): LabAvailabilityView {
  return {
    source: snapshot.source,
    labEnabled: isLabEnabled(snapshot, lab.id),
    variants: lab.variants.map((variant) => ({
      key: variant.key,
      enabled:
        variant.enabled && isVariantEnabled(snapshot, lab.id, variant.key),
    })),
  };
}

/** 数据库中没有登记的实验按启用处理，避免未执行 seed:labs 时整站不可用 */
export function isLabEnabled(
  snapshot: LabAvailabilitySnapshot,
  labKey: string,
) {
  return snapshot.labs.get(labKey) ?? true;
}

/** 变体生效值 = 实验级启用 && 变体级启用；任一层在数据库中缺失都按启用处理 */
export function isVariantEnabled(
  snapshot: LabAvailabilitySnapshot,
  labKey: string,
  variantKey: string,
) {
  if (!isLabEnabled(snapshot, labKey)) {
    return false;
  }

  return (
    snapshot.variants.get(buildVariantAvailabilityKey(labKey, variantKey)) ??
    true
  );
}
