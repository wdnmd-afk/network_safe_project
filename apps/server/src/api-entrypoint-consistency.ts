import type { LabMetadata } from "@network-safe/shared/lab-metadata";

export type ApiRouteRecord = {
  id: string;
  index: number;
  method: string;
  path: string;
};

export type ApiEntrypointConsistencyError = {
  code: string;
  labId?: string;
  variant?: string;
  entryKey?: string;
  method?: string;
  path?: string;
  routePath?: string;
  message: string;
};

export type ApiEntrypointConsistencyReport = {
  ok: boolean;
  labCount: number;
  routeCount: number;
  labRouteCount: number;
  apiEntrypointCount: number;
  matchedEntrypointCount: number;
  coveredLabRouteCount: number;
  errors: ApiEntrypointConsistencyError[];
};

const supportedMethods = new Set(["DELETE", "GET", "PATCH", "POST", "PUT"]);

const platformLabRouteIds = new Set([
  "POST /api/labs/:category/:scene/learning-progress",
  "POST /api/labs/:category/:scene/verification-records",
  "GET /api/labs",
  "GET /api/labs/:category/:scene",
]);

function normalizePath(value: string) {
  if (!value.startsWith("/") || value.includes("?") || value.includes("#")) {
    return null;
  }

  return value === "/" ? value : value.replace(/\/+$/, "");
}

function decodeSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function matchSegment(routeSegment: string, candidateSegment: string) {
  if (!routeSegment.startsWith(":")) {
    return routeSegment === candidateSegment
      ? { matched: true, name: null, value: null }
      : { matched: false, name: null, value: null };
  }

  const parameter = routeSegment.match(
    /^:([A-Za-z_][A-Za-z0-9_]*)(?:\((.*)\))?$/,
  );

  if (!parameter) {
    return { matched: false, name: null, value: null };
  }

  const [, name, customPattern] = parameter;
  const decoded = decodeSegment(candidateSegment);

  if (decoded === null) {
    return { matched: false, name: null, value: null };
  }

  if (customPattern) {
    try {
      if (!new RegExp(`^(?:${customPattern})$`).test(decoded)) {
        return { matched: false, name: null, value: null };
      }
    } catch {
      return { matched: false, name: null, value: null };
    }
  }

  return { matched: true, name, value: decoded };
}

export function matchApiRoutePath(routePath: string, candidatePath: string) {
  const normalizedRoute = normalizePath(routePath);
  const normalizedCandidate = normalizePath(candidatePath);

  if (!normalizedRoute || !normalizedCandidate) {
    return null;
  }

  const routeSegments =
    normalizedRoute === "/" ? [] : normalizedRoute.slice(1).split("/");
  const candidateSegments =
    normalizedCandidate === "/"
      ? []
      : normalizedCandidate.slice(1).split("/");

  if (routeSegments.length !== candidateSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (const [index, routeSegment] of routeSegments.entries()) {
    const result = matchSegment(routeSegment, candidateSegments[index]);

    if (!result.matched) {
      return null;
    }

    if (result.name && result.value !== null) {
      params[result.name] = result.value;
    }
  }

  return params;
}

export function collectExpressApiRoutes(app: unknown): ApiRouteRecord[] {
  const application = app as {
    router?: { stack?: unknown[] };
    _router?: { stack?: unknown[] };
  };
  const stack = application.router?.stack ?? application._router?.stack ?? [];
  const routes: ApiRouteRecord[] = [];

  stack.forEach((layer, layerIndex) => {
    const route = (layer as {
      route?: {
        path?: string | string[];
        methods?: Record<string, boolean>;
      };
    }).route;

    if (!route?.path || !route.methods) {
      return;
    }

    const paths = Array.isArray(route.path) ? route.path : [route.path];
    const methods = Object.entries(route.methods)
      .filter(([, enabled]) => enabled)
      .map(([method]) => method.toUpperCase());

    for (const path of paths) {
      if (!path.startsWith("/api/")) {
        continue;
      }

      for (const method of methods) {
        routes.push({
          id: `${method} ${path}#${layerIndex}`,
          index: layerIndex,
          method,
          path,
        });
      }
    }
  });

  return routes.sort((left, right) => left.index - right.index);
}

export function findFirstMatchingApiRoute(
  routes: readonly ApiRouteRecord[],
  method: string,
  path: string,
) {
  const normalizedMethod = method.toUpperCase();

  for (const route of routes) {
    if (route.method !== normalizedMethod) {
      continue;
    }

    const params = matchApiRoutePath(route.path, path);

    if (params) {
      return { route, params };
    }
  }

  return null;
}

function routeContractId(route: Pick<ApiRouteRecord, "method" | "path">) {
  return `${route.method} ${route.path}`;
}

export function verifyApiEntrypointConsistency(
  metadataItems: readonly LabMetadata[],
  routes: readonly ApiRouteRecord[],
): ApiEntrypointConsistencyReport {
  const errors: ApiEntrypointConsistencyError[] = [];
  const entryKeysByLab = new Map<string, string>();
  const entryContracts = new Map<string, string>();
  const coveredRouteIds = new Set<string>();
  let apiEntrypointCount = 0;
  let matchedEntrypointCount = 0;

  for (const metadata of metadataItems) {
    const validVariants = new Set([
      "shared",
      ...metadata.variants.map((variant) => variant.key),
    ]);

    for (const entrypoint of metadata.entrypoints.api) {
      apiEntrypointCount += 1;
      const method = entrypoint.method?.toUpperCase() ?? "";
      const variant = entrypoint.variant ?? "";
      const entryIdentity = `${metadata.id}:${entrypoint.key}`;
      const contractIdentity = `${method} ${entrypoint.path}`;
      const previousKey = entryKeysByLab.get(entryIdentity);
      const previousContract = entryContracts.get(contractIdentity);

      if (previousKey) {
        errors.push({
          code: "duplicate-api-entry-key",
          labId: metadata.id,
          entryKey: entrypoint.key,
          method,
          path: entrypoint.path,
          message: `API 入口键 ${entrypoint.key} 在实验内重复。`,
        });
      } else {
        entryKeysByLab.set(entryIdentity, entryIdentity);
      }

      if (previousContract) {
        errors.push({
          code: "duplicate-api-entry-contract",
          labId: metadata.id,
          entryKey: entrypoint.key,
          method,
          path: entrypoint.path,
          message: `API 合约 ${contractIdentity} 已由 ${previousContract} 使用。`,
        });
      } else {
        entryContracts.set(contractIdentity, entryIdentity);
      }

      if (!supportedMethods.has(method)) {
        errors.push({
          code: "invalid-api-entry-method",
          labId: metadata.id,
          entryKey: entrypoint.key,
          method,
          path: entrypoint.path,
          message: `API 入口 ${entrypoint.key} 缺少或使用不支持的 method。`,
        });
        continue;
      }

      if (!validVariants.has(variant)) {
        errors.push({
          code: "invalid-api-entry-variant",
          labId: metadata.id,
          variant,
          entryKey: entrypoint.key,
          method,
          path: entrypoint.path,
          message: `API 入口 ${entrypoint.key} 的 variant 未登记。`,
        });
        continue;
      }

      const expectedPrefix = `/api/labs/${metadata.category}/${metadata.slug}`;

      if (
        entrypoint.path !== expectedPrefix &&
        !entrypoint.path.startsWith(`${expectedPrefix}/`)
      ) {
        errors.push({
          code: "api-entry-lab-prefix-mismatch",
          labId: metadata.id,
          variant,
          entryKey: entrypoint.key,
          method,
          path: entrypoint.path,
          message: `API 入口必须位于 ${expectedPrefix} 下。`,
        });
        continue;
      }

      if (
        (variant === "vuln" || variant === "fixed") &&
        !entrypoint.path.split("/").includes(variant)
      ) {
        errors.push({
          code: "api-entry-variant-path-mismatch",
          labId: metadata.id,
          variant,
          entryKey: entrypoint.key,
          method,
          path: entrypoint.path,
          message: `API 入口路径未包含声明的 ${variant} 变体。`,
        });
        continue;
      }

      const match = findFirstMatchingApiRoute(routes, method, entrypoint.path);

      if (!match) {
        errors.push({
          code: "missing-api-route",
          labId: metadata.id,
          variant,
          entryKey: entrypoint.key,
          method,
          path: entrypoint.path,
          message: `API 入口 ${contractIdentity} 无法匹配 Express 路由。`,
        });
        continue;
      }

      const resolvedVariant = match.params.variant;

      if (
        resolvedVariant &&
        (variant === "vuln" || variant === "fixed") &&
        resolvedVariant !== variant
      ) {
        errors.push({
          code: "api-route-variant-mismatch",
          labId: metadata.id,
          variant,
          entryKey: entrypoint.key,
          method,
          path: entrypoint.path,
          routePath: match.route.path,
          message: `首个匹配路由解析变体为 ${resolvedVariant}。`,
        });
        continue;
      }

      if (
        (match.params.category && match.params.category !== metadata.category) ||
        (match.params.scene && match.params.scene !== metadata.slug)
      ) {
        errors.push({
          code: "api-route-lab-identity-mismatch",
          labId: metadata.id,
          variant,
          entryKey: entrypoint.key,
          method,
          path: entrypoint.path,
          routePath: match.route.path,
          message: "首个匹配路由解析出的分类或场景与元数据不一致。",
        });
        continue;
      }

      coveredRouteIds.add(match.route.id);
      matchedEntrypointCount += 1;
    }
  }

  const labRoutes = routes.filter(
    (route) =>
      route.path.startsWith("/api/labs") &&
      !platformLabRouteIds.has(routeContractId(route)),
  );

  for (const route of labRoutes) {
    if (!coveredRouteIds.has(route.id)) {
      errors.push({
        code: "orphan-lab-api-route",
        method: route.method,
        routePath: route.path,
        message: `实验运行时路由 ${routeContractId(route)} 没有元数据 API 入口覆盖。`,
      });
    }
  }

  return {
    ok: errors.length === 0,
    labCount: metadataItems.length,
    routeCount: routes.length,
    labRouteCount: labRoutes.length,
    apiEntrypointCount,
    matchedEntrypointCount,
    coveredLabRouteCount: labRoutes.filter((route) => coveredRouteIds.has(route.id))
      .length,
    errors,
  };
}

