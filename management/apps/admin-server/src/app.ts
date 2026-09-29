import express, { type Request, type Response } from "express";

import type { AdminUser } from "@nsm/shared";

import {
  createPrismaAdminRepository,
  type AdminRepository,
} from "./services/admin-repository.js";
import {
  QueryError,
  buildTraceDetail,
  computeBlockRate,
  fillDailySeries,
  isValidLabKey,
  normalizeRiskCounts,
  parseAuditQuery,
  parseEventQuery,
  parseLabFilter,
  parseToggleBody,
  sanitizeAuditUsername,
  summarizeRecap,
  toAdminEvent,
  toAuditLogItem,
} from "./services/admin-logic.js";
import {
  createAdminAuthService,
  type AdminAuthService,
} from "./services/admin-auth.js";
import { requestJson } from "./lib/http-json.js";

export type MainSiteProbe = (
  url: string,
  timeoutMs: number,
) => Promise<{ ok: boolean; status: number; body: unknown }>;

export type CreateAdminAppOptions = {
  repository?: AdminRepository;
  authService?: AdminAuthService;
  tokenSecret?: string;
  tokenTtlMs?: number;
  mainSiteOrigin?: string;
  mainSiteProbe?: MainSiteProbe;
};

type MainSiteStatus = {
  reachable: boolean;
  availabilitySource: "database" | "metadata-fallback" | null;
};

const defaultMainSiteOrigin = "http://127.0.0.1:6667";
const mainSiteTimeoutMs = 1500;

export function createAdminApp(options: CreateAdminAppOptions = {}) {
  const app = express();
  const repository = options.repository ?? createPrismaAdminRepository();
  const tokenSecret = options.tokenSecret ?? process.env.ADMIN_TOKEN_SECRET ?? "";

  if (!tokenSecret) {
    // 不允许空密钥静默降级：空密钥等于任何人都能伪造管理员令牌
    throw new Error("缺少 ADMIN_TOKEN_SECRET，无法创建管理端应用");
  }

  const authService =
    options.authService ??
    createAdminAuthService({
      repository,
      tokenSecret,
      tokenTtlMs: options.tokenTtlMs ?? 8 * 60 * 60 * 1000,
    });
  const mainSiteOrigin = options.mainSiteOrigin ?? defaultMainSiteOrigin;
  // 默认用 node:http 探测，不能用 fetch：主站端口 6667 在 Fetch 规范的坏端口名单内
  const mainSiteProbe = options.mainSiteProbe ?? requestJson;

  app.use(express.json({ limit: "32kb" }));

  // 管理端响应含跨用户审计数据，统一禁止缓存与嗅探
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  function sendError(res: Response, status: number, message: string) {
    res.status(status).json({ status: "error", message });
  }

  function readBearerToken(req: Request) {
    const header = req.header("authorization");

    if (!header || !header.startsWith("Bearer ")) {
      return undefined;
    }

    const token = header.slice("Bearer ".length).trim();

    return token || undefined;
  }

  /**
   * 受保护路由的统一入口。
   *
   * 返回 null 表示已经写过响应（401 / 403），调用方直接 return。
   * 每个请求都重新查库判角色，不复用 token 里的任何权限信息。
   */
  async function requireAdmin(
    req: Request,
    res: Response,
  ): Promise<AdminUser | null> {
    const outcome = await authService.authenticate(readBearerToken(req));

    if (!outcome.ok) {
      sendError(res, outcome.status, outcome.message);
      return null;
    }

    return outcome.user;
  }

  function handleQueryError(error: unknown, res: Response) {
    if (error instanceof QueryError) {
      sendError(res, 400, error.message);
      return true;
    }

    if (error instanceof RangeError) {
      // BigInt() 对非数字输入抛 RangeError
      sendError(res, 400, "identifier must be numeric");
      return true;
    }

    return false;
  }

  function readLabKeyParam(value: string) {
    if (!isValidLabKey(value)) {
      throw new QueryError("labKey is invalid");
    }

    return value;
  }

  async function readMainSiteStatus(): Promise<MainSiteStatus> {
    try {
      const response = await mainSiteProbe(
        `${mainSiteOrigin}/api/platform-info`,
        mainSiteTimeoutMs,
      );

      if (!response.ok) {
        return { reachable: false, availabilitySource: null };
      }

      const body = response.body as {
        consistency?: { availabilitySource?: unknown };
      };
      const source = body?.consistency?.availabilitySource;

      return {
        reachable: true,
        availabilitySource:
          source === "database" || source === "metadata-fallback" ? source : null,
      };
    } catch {
      // 主站未启动属正常情况，管理端仍应可用，只是提示主站不可达
      return { reachable: false, availabilitySource: null };
    }
  }

  app.get("/api/admin/health", async (_req, res) => {
    try {
      await repository.ping();
      res.status(200).json({ status: "ok", database: "ok" });
    } catch (error) {
      res.status(503).json({
        status: "error",
        database: "unavailable",
        message: error instanceof Error ? error.message : "database unavailable",
      });
    }
  });

  app.post("/api/admin/auth/login", async (req, res, next) => {
    try {
      const outcome = await authService.login({
        username: req.body?.username,
        password: req.body?.password,
      });

      if (!outcome.ok) {
        await repository.createAuditLog({
          adminUserId: null,
          action: "auth.login.failure",
          targetType: "session",
          targetKey: sanitizeAuditUsername(req.body?.username),
          before: null,
          after: null,
        });

        sendError(res, outcome.status, outcome.message);
        return;
      }

      await repository.createAuditLog({
        adminUserId: outcome.user.id,
        action: "auth.login.success",
        targetType: "session",
        targetKey: outcome.user.username,
        before: null,
        after: null,
      });

      res.status(200).json({
        status: "ok",
        token: outcome.token,
        user: outcome.user,
        expiresAt: outcome.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/auth/me", async (req, res, next) => {
    try {
      const user = await requireAdmin(req, res);

      if (!user) {
        return;
      }

      res.status(200).json({ status: "ok", user });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/auth/logout", async (req, res, next) => {
    try {
      await authService.logout(readBearerToken(req));
      res.status(200).json({ status: "ok" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/overview", async (req, res, next) => {
    try {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      const [counts, daily, mainSite] = await Promise.all([
        repository.readOverviewCounts(),
        repository.countEventsByDay(
          new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        ),
        readMainSiteStatus(),
      ]);

      res.status(200).json({
        status: "ok",
        labs: {
          total: counts.labs,
          enabled: counts.enabledLabs,
          categories: counts.categories,
        },
        variants: {
          total: counts.variants,
          enabled: counts.enabledVariants,
        },
        events: {
          total: counts.events,
          blocked: counts.blocked,
          blockRate: computeBlockRate(counts.blocked, counts.events),
          byRisk: normalizeRiskCounts(counts.byRisk),
          daily: fillDailySeries(daily, 7),
        },
        learners: counts.learners,
        mainSite,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/events", async (req, res, next) => {
    try {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      const query = parseEventQuery(req.query as Record<string, unknown>);
      const { items, total } = await repository.listEvents(query);

      res.status(200).json({
        items: items.map(toAdminEvent),
        total,
        page: query.page,
        pageSize: query.pageSize,
      });
    } catch (error) {
      if (handleQueryError(error, res)) {
        return;
      }

      next(error);
    }
  });

  app.get("/api/admin/events/traces/:traceId", async (req, res, next) => {
    try {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      const traceId = req.params.traceId;

      if (!/^[\w-]{1,64}$/.test(traceId)) {
        sendError(res, 400, "traceId is invalid");
        return;
      }

      const detail = buildTraceDetail(
        traceId,
        await repository.listTraceEvents(traceId),
      );

      if (!detail) {
        sendError(res, 404, "trace not found");
        return;
      }

      res.status(200).json({ status: "ok", trace: detail });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/labs", async (req, res, next) => {
    try {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      const filter = parseLabFilter(req.query as Record<string, unknown>);
      const labs = await repository.listLabs(filter);

      res.status(200).json({ status: "ok", items: labs, total: labs.length });
    } catch (error) {
      if (handleQueryError(error, res)) {
        return;
      }

      next(error);
    }
  });

  app.patch("/api/admin/labs/:labKey", async (req, res, next) => {
    try {
      const user = await requireAdmin(req, res);

      if (!user) {
        return;
      }

      const labKey = readLabKeyParam(req.params.labKey);
      const isEnabled = parseToggleBody(req.body);
      const result = await repository.setLabEnabled(labKey, isEnabled, {
        adminUserId: user.id,
        action: isEnabled ? "lab.enable" : "lab.disable",
        targetType: "lab",
        targetKey: labKey,
        before: null,
        after: { isEnabled },
      });

      if (!result) {
        sendError(res, 404, "lab not found");
        return;
      }

      res.status(200).json({ status: "ok", ...result });
    } catch (error) {
      if (handleQueryError(error, res)) {
        return;
      }

      next(error);
    }
  });

  app.patch(
    "/api/admin/labs/:labKey/variants/:variantKey",
    async (req, res, next) => {
      try {
        const user = await requireAdmin(req, res);

        if (!user) {
          return;
        }

        const labKey = readLabKeyParam(req.params.labKey);
        const variantKey = req.params.variantKey;

        if (variantKey !== "vuln" && variantKey !== "fixed") {
          sendError(res, 400, "variantKey must be vuln or fixed");
          return;
        }

        const isEnabled = parseToggleBody(req.body);
        const result = await repository.setVariantEnabled(
          labKey,
          variantKey,
          isEnabled,
          {
            adminUserId: user.id,
            action: isEnabled ? "variant.enable" : "variant.disable",
            targetType: "variant",
            targetKey: `${labKey}:${variantKey}`,
            before: null,
            after: { isEnabled },
          },
        );

        if (!result) {
          sendError(res, 404, "lab variant not found");
          return;
        }

        res.status(200).json({ status: "ok", ...result });
      } catch (error) {
        if (handleQueryError(error, res)) {
          return;
        }

        next(error);
      }
    },
  );

  app.get("/api/admin/learners", async (req, res, next) => {
    try {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      const learners = await repository.listLearners();

      res.status(200).json({
        status: "ok",
        items: learners.map((learner) => ({
          ...learner,
          lastActivityAt: learner.lastActivityAt?.toISOString() ?? null,
        })),
        total: learners.length,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/learners/:userId", async (req, res, next) => {
    try {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      if (!/^\d{1,20}$/.test(req.params.userId)) {
        sendError(res, 400, "userId must be numeric");
        return;
      }

      const detail = await repository.findLearner(req.params.userId);

      if (!detail) {
        sendError(res, 404, "learner not found");
        return;
      }

      res.status(200).json({
        status: "ok",
        learner: {
          ...detail.learner,
          lastActivityAt: detail.learner.lastActivityAt?.toISOString() ?? null,
        },
        progress: detail.progress.map((row) => ({
          // 对外字段名与主项目 /api/lab-records/me 保持一致，用 title 而不是 labTitle
          labKey: row.labKey,
          title: row.labTitle,
          variantKey: row.variantKey,
          status: row.status,
          updatedAt: row.updatedAt.toISOString(),
        })),
        verifications: detail.verifications.map((row) => ({
          labKey: row.labKey,
          title: row.labTitle,
          variantKey: row.variantKey,
          result: row.result,
          summary: row.summary,
          createdAt: row.createdAt.toISOString(),
        })),
        recap: summarizeRecap(detail.recap),
      });
    } catch (error) {
      if (handleQueryError(error, res)) {
        return;
      }

      next(error);
    }
  });

  app.get("/api/admin/audit-logs", async (req, res, next) => {
    try {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      const query = parseAuditQuery(req.query as Record<string, unknown>);
      const { items, total } = await repository.listAuditLogs(query);

      res.status(200).json({
        items: items.map(toAuditLogItem),
        total,
        page: query.page,
        pageSize: query.pageSize,
      });
    } catch (error) {
      if (handleQueryError(error, res)) {
        return;
      }

      next(error);
    }
  });

  // 兜底：不回传内部错误文本，避免 Prisma 错误里带出连接串等信息
  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: express.NextFunction,
    ) => {
      console.error(
        `[ADMIN_SERVER_ERROR] ${error instanceof Error ? error.message : String(error)}`,
      );

      if (!res.headersSent) {
        res.status(500).json({ status: "error", message: "internal error" });
      }
    },
  );

  return app;
}
