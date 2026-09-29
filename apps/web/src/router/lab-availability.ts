import type { LabAvailability } from "../api/labs";

export type LabVariantRouteTarget = {
  category: string;
  scene: string;
  variant: "vuln" | "fixed";
};

// 只识别实验变体页形态，详情页、目录页和平台页一律不处理
const variantRoutePattern = /^\/labs\/([^/]+)\/([^/]+)\/(vuln|fixed)\/?$/;

export function parseLabVariantRoute(path: string): LabVariantRouteTarget | null {
  const match = variantRoutePattern.exec(path);

  if (!match) {
    return null;
  }

  return {
    category: match[1],
    scene: match[2],
    variant: match[3] as LabVariantRouteTarget["variant"],
  };
}

/**
 * 根据服务端返回的可用性视图决定是否重定向。
 *
 * 返回 null 表示放行。可用性缺失（接口失败、数据库不可用）时放行，
 * 与服务端 metadata-fallback 的放行语义保持一致。
 */
export function resolveVariantRedirect(
  target: LabVariantRouteTarget,
  availability: LabAvailability | null,
) {
  if (!availability) {
    return null;
  }

  const variant = availability.variants.find((item) => item.key === target.variant);

  if (!variant || variant.enabled) {
    return null;
  }

  return {
    path: `/labs/${target.category}/${target.scene}`,
    query: {
      disabled: target.variant,
    },
  };
}

/**
 * 目录与详情页判断某个变体是否可进入。
 *
 * 可用性里找不到该变体时按启用处理，与守卫放行语义一致；
 * 只有服务端明确返回 enabled: false 才视为停用。
 */
export function isCatalogVariantEnabled(
  availability: LabAvailability | null | undefined,
  variantKey: string,
) {
  const variant = availability?.variants.find((item) => item.key === variantKey);
  return variant ? variant.enabled : true;
}

export type LabAvailabilityLoader = (
  category: string,
  scene: string,
) => Promise<LabAvailability>;

/**
 * 前台变体页守卫。
 *
 * 每次进入变体页都实时读取可用性，不做会话级缓存：管理端停用后，
 * 用户下一次导航即生效，不需要刷新页面。读取失败按放行处理。
 */
export function createLabVariantGuard(loadAvailability: LabAvailabilityLoader) {
  return async (to: { path: string }) => {
    const target = parseLabVariantRoute(to.path);

    if (!target) {
      return true;
    }

    let availability: LabAvailability | null = null;

    try {
      availability = await loadAvailability(target.category, target.scene);
    } catch {
      availability = null;
    }

    return resolveVariantRedirect(target, availability) ?? true;
  };
}
