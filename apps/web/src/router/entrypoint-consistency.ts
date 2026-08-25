import type { LabMetadata } from "../../../../packages/shared/src/lab-metadata.js";

export type RouteRecordLike = {
  path: string;
  name?: unknown;
  props?: unknown;
  alias?: string | string[];
  children?: readonly RouteRecordLike[];
};

export type RoutePathMatch = {
  routePath: string;
  routeName: string;
  params: Record<string, string>;
  props: unknown;
};

export type WebEntrypointConsistencyError = {
  code: string;
  labId: string;
  variant?: string;
  entryKey?: string;
  path?: string;
  message: string;
};

export type WebEntrypointConsistencyReport = {
  ok: boolean;
  labCount: number;
  routeCount: number;
  enabledVariantCount: number;
  webEntrypointCount: number;
  matchedEntrypointCount: number;
  errors: WebEntrypointConsistencyError[];
};

type FlattenedRoute = {
  path: string;
  name: string;
  props: unknown;
};

function normalizePath(value: string) {
  if (!value.startsWith("/") || value.includes("?") || value.includes("#")) {
    return null;
  }

  if (value === "/") {
    return value;
  }

  return value.replace(/\/+$/, "");
}

function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function matchRouteSegment(routeSegment: string, pathSegment: string) {
  if (!routeSegment.startsWith(":")) {
    return routeSegment === pathSegment
      ? { matched: true, paramName: null, paramValue: null }
      : { matched: false, paramName: null, paramValue: null };
  }

  const parameterMatch = routeSegment.match(
    /^:([A-Za-z_][A-Za-z0-9_]*)(?:\((.*)\))?$/,
  );

  if (!parameterMatch) {
    return { matched: false, paramName: null, paramValue: null };
  }

  const [, paramName, customPattern] = parameterMatch;
  const decodedValue = decodePathSegment(pathSegment);

  if (decodedValue === null) {
    return { matched: false, paramName: null, paramValue: null };
  }

  if (customPattern) {
    try {
      if (!new RegExp(`^(?:${customPattern})$`).test(decodedValue)) {
        return { matched: false, paramName: null, paramValue: null };
      }
    } catch {
      return { matched: false, paramName: null, paramValue: null };
    }
  }

  return {
    matched: true,
    paramName,
    paramValue: decodedValue,
  };
}

export function matchRoutePath(routePath: string, candidatePath: string) {
  const normalizedRoutePath = normalizePath(routePath);
  const normalizedCandidatePath = normalizePath(candidatePath);

  if (!normalizedRoutePath || !normalizedCandidatePath) {
    return null;
  }

  const routeSegments =
    normalizedRoutePath === "/" ? [] : normalizedRoutePath.slice(1).split("/");
  const pathSegments =
    normalizedCandidatePath === "/"
      ? []
      : normalizedCandidatePath.slice(1).split("/");

  if (routeSegments.length !== pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (const [index, routeSegment] of routeSegments.entries()) {
    const segmentMatch = matchRouteSegment(routeSegment, pathSegments[index]);

    if (!segmentMatch.matched) {
      return null;
    }

    if (segmentMatch.paramName && segmentMatch.paramValue !== null) {
      params[segmentMatch.paramName] = segmentMatch.paramValue;
    }
  }

  return params;
}

function joinRoutePath(parentPath: string, childPath: string) {
  if (childPath.startsWith("/")) {
    return childPath;
  }

  if (parentPath === "/") {
    return `/${childPath}`;
  }

  return `${parentPath.replace(/\/$/, "")}/${childPath}`;
}

function flattenRouteRecords(
  routeRecords: readonly RouteRecordLike[],
  parentPath = "",
  output: FlattenedRoute[] = [],
) {
  for (const route of routeRecords) {
    const routePath = parentPath ? joinRoutePath(parentPath, route.path) : route.path;
    const routeName = route.name === undefined ? "" : String(route.name);

    output.push({ path: routePath, name: routeName, props: route.props });

    const aliases = Array.isArray(route.alias)
      ? route.alias
      : route.alias
        ? [route.alias]
        : [];

    for (const alias of aliases) {
      output.push({
        path: parentPath ? joinRoutePath(parentPath, alias) : alias,
        name: routeName,
        props: route.props,
      });
    }

    if (route.children?.length) {
      flattenRouteRecords(route.children, routePath, output);
    }
  }

  return output;
}

export function findFirstMatchingRoute(
  routeRecords: readonly RouteRecordLike[],
  candidatePath: string,
): RoutePathMatch | null {
  for (const route of flattenRouteRecords(routeRecords)) {
    const params = matchRoutePath(route.path, candidatePath);

    if (params) {
      return {
        routePath: route.path,
        routeName: route.name,
        params,
        props: route.props,
      };
    }
  }

  return null;
}

function createError(
  error: WebEntrypointConsistencyError,
): WebEntrypointConsistencyError {
  return error;
}

function readStaticVariantProp(props: unknown) {
  if (!props || typeof props !== "object" || Array.isArray(props)) {
    return null;
  }

  const variant = (props as Record<string, unknown>).variant;
  return typeof variant === "string" ? variant : null;
}

export function verifyWebEntrypointConsistency(
  metadataItems: readonly LabMetadata[],
  routeRecords: readonly RouteRecordLike[],
): WebEntrypointConsistencyReport {
  const errors: WebEntrypointConsistencyError[] = [];
  // entryKey 在元数据契约中是实验内标识；不同实验可以复用 vuln/fixed 等本地键。
  // Web path 则必须全局唯一，因为它直接代表浏览器可访问入口。
  const variantEntryKeysByLab = new Map<string, string>();
  const webEntryKeysByLab = new Map<string, string>();
  const globalWebPaths = new Map<string, string>();
  let enabledVariantCount = 0;
  let webEntrypointCount = 0;
  let matchedEntrypointCount = 0;

  for (const metadata of metadataItems) {
    const enabledVariants = metadata.variants.filter((variant) => variant.enabled);
    const variantByKey = new Map(
      metadata.variants.map((variant) => [variant.key, variant]),
    );
    const webEntrypoints = metadata.entrypoints.web;

    enabledVariantCount += enabledVariants.length;
    webEntrypointCount += webEntrypoints.length;

    for (const variant of enabledVariants) {
      const variantIdentity = `${metadata.id}:${variant.key}`;
      const previousLabId = variantEntryKeysByLab.get(
        `${metadata.id}:${variant.entryKey}`,
      );

      if (previousLabId) {
        errors.push(
          createError({
            code: "duplicate-variant-entry-key",
            labId: metadata.id,
            variant: variant.key,
            entryKey: variant.entryKey,
            message: `变体入口键 ${variant.entryKey} 已由 ${previousLabId} 使用。`,
          }),
        );
      } else {
        variantEntryKeysByLab.set(
          `${metadata.id}:${variant.entryKey}`,
          variantIdentity,
        );
      }
    }

    for (const entrypoint of webEntrypoints) {
      const entryIdentity = `${metadata.id}:${entrypoint.variant ?? "missing"}`;
      const previousEntryIdentity = webEntryKeysByLab.get(
        `${metadata.id}:${entrypoint.key}`,
      );
      const previousPathIdentity = globalWebPaths.get(entrypoint.path);

      if (previousEntryIdentity) {
        errors.push(
          createError({
            code: "duplicate-web-entry-key",
            labId: metadata.id,
            variant: entrypoint.variant,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `Web 入口键 ${entrypoint.key} 已由 ${previousEntryIdentity} 使用。`,
          }),
        );
      } else {
        webEntryKeysByLab.set(
          `${metadata.id}:${entrypoint.key}`,
          entryIdentity,
        );
      }

      if (previousPathIdentity) {
        errors.push(
          createError({
            code: "duplicate-web-entry-path",
            labId: metadata.id,
            variant: entrypoint.variant,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `Web 入口路径 ${entrypoint.path} 已由 ${previousPathIdentity} 使用。`,
          }),
        );
      } else {
        globalWebPaths.set(entrypoint.path, entryIdentity);
      }

      if (!entrypoint.variant) {
        errors.push(
          createError({
            code: "missing-web-entry-variant",
            labId: metadata.id,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `Web 入口 ${entrypoint.key} 缺少 variant。`,
          }),
        );
        continue;
      }

      const linkedVariant = variantByKey.get(entrypoint.variant);

      if (!linkedVariant) {
        errors.push(
          createError({
            code: "unknown-web-entry-variant",
            labId: metadata.id,
            variant: entrypoint.variant,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `Web 入口 ${entrypoint.key} 引用了未登记变体 ${entrypoint.variant}。`,
          }),
        );
      } else if (!linkedVariant.enabled) {
        errors.push(
          createError({
            code: "disabled-web-entry-variant",
            labId: metadata.id,
            variant: entrypoint.variant,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `Web 入口 ${entrypoint.key} 指向未启用变体 ${entrypoint.variant}。`,
          }),
        );
      }
    }

    for (const variant of enabledVariants) {
      const matchingEntrypoints = webEntrypoints.filter(
        (entrypoint) => entrypoint.key === variant.entryKey,
      );

      if (matchingEntrypoints.length === 0) {
        errors.push(
          createError({
            code: "missing-variant-web-entry",
            labId: metadata.id,
            variant: variant.key,
            entryKey: variant.entryKey,
            message: `启用变体 ${variant.key} 的入口键 ${variant.entryKey} 没有对应 Web 入口。`,
          }),
        );
        continue;
      }

      if (matchingEntrypoints.length > 1) {
        errors.push(
          createError({
            code: "duplicate-variant-web-entry",
            labId: metadata.id,
            variant: variant.key,
            entryKey: variant.entryKey,
            message: `启用变体 ${variant.key} 的入口键 ${variant.entryKey} 对应多个 Web 入口。`,
          }),
        );
        continue;
      }

      const entrypoint = matchingEntrypoints[0];

      if (entrypoint.variant !== variant.key) {
        errors.push(
          createError({
            code: "variant-entry-mismatch",
            labId: metadata.id,
            variant: variant.key,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `变体 ${variant.key} 的入口声明为 ${entrypoint.variant ?? "missing"}。`,
          }),
        );
        continue;
      }

      const expectedPath = `/labs/${metadata.category}/${metadata.slug}/${variant.key}`;

      if (entrypoint.path !== expectedPath) {
        errors.push(
          createError({
            code: "noncanonical-web-entry-path",
            labId: metadata.id,
            variant: variant.key,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `Web 入口路径应为 ${expectedPath}，实际为 ${entrypoint.path}。`,
          }),
        );
        continue;
      }

      const routeMatch = findFirstMatchingRoute(routeRecords, entrypoint.path);

      if (!routeMatch) {
        errors.push(
          createError({
            code: "missing-web-route",
            labId: metadata.id,
            variant: variant.key,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `Web 入口 ${entrypoint.path} 无法匹配前端路由。`,
          }),
        );
        continue;
      }

      const staticVariant = readStaticVariantProp(routeMatch.props);
      const resolvedVariant = routeMatch.params.variant ?? staticVariant;

      if (resolvedVariant !== variant.key) {
        errors.push(
          createError({
            code: "route-variant-mismatch",
            labId: metadata.id,
            variant: variant.key,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `首个匹配路由 ${routeMatch.routePath} 解析变体为 ${resolvedVariant ?? "missing"}。`,
          }),
        );
        continue;
      }

      if (
        (routeMatch.params.category &&
          routeMatch.params.category !== metadata.category) ||
        (routeMatch.params.scene && routeMatch.params.scene !== metadata.slug)
      ) {
        errors.push(
          createError({
            code: "route-identity-mismatch",
            labId: metadata.id,
            variant: variant.key,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `首个匹配路由 ${routeMatch.routePath} 解析出的分类或场景与元数据不一致。`,
          }),
        );
        continue;
      }

      matchedEntrypointCount += 1;
    }

    const enabledEntryKeys = new Set(
      enabledVariants.map((variant) => variant.entryKey),
    );

    for (const entrypoint of webEntrypoints) {
      if (!enabledEntryKeys.has(entrypoint.key)) {
        errors.push(
          createError({
            code: "orphan-web-entry",
            labId: metadata.id,
            variant: entrypoint.variant,
            entryKey: entrypoint.key,
            path: entrypoint.path,
            message: `Web 入口 ${entrypoint.key} 未被任何启用变体引用。`,
          }),
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    labCount: metadataItems.length,
    routeCount: flattenRouteRecords(routeRecords).length,
    enabledVariantCount,
    webEntrypointCount,
    matchedEntrypointCount,
    errors,
  };
}
