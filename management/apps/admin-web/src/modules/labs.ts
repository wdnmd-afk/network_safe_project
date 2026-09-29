import type { AdminLab } from "@nsm/shared";

export type LabCategoryGroup = {
  categoryCode: string;
  categoryName: string;
  labs: AdminLab[];
};

export function groupLabsByCategory(labs: AdminLab[]): LabCategoryGroup[] {
  const groups = new Map<string, LabCategoryGroup>();

  for (const lab of labs) {
    const group = groups.get(lab.categoryCode) ?? {
      categoryCode: lab.categoryCode,
      categoryName: lab.categoryName,
      labs: [],
    };

    group.labs.push(lab);
    groups.set(lab.categoryCode, group);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      labs: [...group.labs].sort((left, right) =>
        left.labKey.localeCompare(right.labKey),
      ),
    }))
    .sort((left, right) => left.categoryCode.localeCompare(right.categoryCode));
}

export type ToggleIntent = {
  nextEnabled: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
};

/**
 * 停用是会影响学习者的操作，必须二次确认；启用是恢复操作，确认文案也要说清后果。
 */
export function describeToggle(target: "lab" | "variant", nextEnabled: boolean): ToggleIntent {
  const subject = target === "lab" ? "实验" : "变体";

  if (nextEnabled) {
    return {
      nextEnabled: true,
      title: `启用该${subject}`,
      message: `启用后，学习者在主站可以重新进入这个${subject}。`,
      confirmLabel: "确认启用",
      danger: false,
    };
  }

  return {
    nextEnabled: false,
    title: `停用该${subject}`,
    message:
      target === "lab"
        ? "停用后，主站目录不再给出入口，相关接口返回 403，已打开页面刷新后也会被拦截。"
        : "停用后，主站目录不再给出该变体入口，对应接口返回 403。另一个变体不受影响。",
    confirmLabel: "确认停用",
    danger: true,
  };
}

export function summarizeLabCounts(labs: AdminLab[]) {
  const variants = labs.flatMap((lab) => lab.variants);

  return {
    labs: labs.length,
    enabledLabs: labs.filter((lab) => lab.isEnabled).length,
    variants: variants.length,
    enabledVariants: variants.filter((variant) => variant.isEnabled).length,
  };
}
