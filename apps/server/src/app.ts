import express from "express";
import type { LabMetadata } from "@network-safe/shared/lab-metadata";

import { createAuthService, type AuthService } from "./services/auth.js";
import { createLabRegistry } from "./services/lab-registry.js";
import {
  createLabRecordsService,
  LabRecordError,
  type LabRecordsService,
} from "./services/lab-records.js";

type DatabaseHealth = {
  status: string;
  message?: string;
};

type CreateAppOptions = {
  checkDatabaseHealth?: () => Promise<DatabaseHealth>;
  labRegistry?: ReturnType<typeof createLabRegistry>;
  authService?: AuthService;
  labRecordsService?: LabRecordsService;
};

type ErrorResult = {
  ok: false;
  status: number;
  body: {
    status: string;
    message: string;
  };
};

type CurrentUserResult =
  | {
      ok: true;
      user: Awaited<ReturnType<AuthService["getCurrentUser"]>> & {};
    }
  | ErrorResult;

type LabResult =
  | {
      ok: true;
      lab: LabMetadata;
    }
  | ErrorResult;

function getTimestamp() {
  return new Date().toISOString();
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown database error";
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const labRegistry = options.labRegistry ?? createLabRegistry();
  const authService = options.authService ?? createAuthService();
  const labRecordsService =
    options.labRecordsService ?? createLabRecordsService();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "server",
      timestamp: getTimestamp(),
    });
  });

  app.get("/api/health/db", async (_req, res) => {
    try {
      const database = await options.checkDatabaseHealth?.();

      res.status(200).json({
        status: "ok",
        service: "server",
        database: database ?? {
          status: "ok",
        },
        timestamp: getTimestamp(),
      });
    } catch (error) {
      res.status(503).json({
        status: "error",
        service: "server",
        database: {
          status: "error",
          message: getErrorMessage(error),
        },
        timestamp: getTimestamp(),
      });
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const username = typeof req.body?.username === "string" ? req.body.username : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const loginResult = await authService.login({
        username,
        password,
      });

      if (!loginResult) {
        res.status(401).json({
          status: "error",
          message: "invalid credentials",
        });
        return;
      }

      res.status(200).json(loginResult);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", async (req, res, next) => {
    try {
      const authorization = req.header("authorization") ?? "";
      const token = authorization.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length)
        : "";

      if (!token) {
        res.status(401).json({
          status: "error",
          message: "missing session token",
        });
        return;
      }

      const user = await authService.getCurrentUser(token);

      if (!user) {
        res.status(401).json({
          status: "error",
          message: "invalid session token",
        });
        return;
      }

      res.status(200).json({
        user,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.status(200).json({
      status: "ok",
    });
  });

  async function readCurrentUser(req: express.Request): Promise<CurrentUserResult> {
    const authorization = req.header("authorization") ?? "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";

    if (!token) {
      return {
        ok: false,
        status: 401,
        body: {
          status: "error",
          message: "missing session token",
        },
      };
    }

    const user = await authService.getCurrentUser(token);

    if (!user) {
      return {
        ok: false,
        status: 401,
        body: {
          status: "error",
          message: "invalid session token",
        },
      };
    }

    return {
      ok: true,
      user,
    };
  }

  async function readLab(category: string, scene: string): Promise<LabResult> {
    const lab = await labRegistry.getLab(category, scene);

    if (!lab) {
      return {
        ok: false,
        status: 404,
        body: {
          status: "error",
          message: "lab not found",
        },
      };
    }

    return {
      ok: true,
      lab,
    };
  }

  function readOptionalString(value: unknown) {
    return typeof value === "string" ? value : undefined;
  }

  function readRequiredString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  app.get("/api/lab-records/me", async (req, res, next) => {
    try {
      const currentUser = await readCurrentUser(req);

      if (!currentUser.ok) {
        res.status(currentUser.status).json(currentUser.body);
        return;
      }

      const records = await labRecordsService.listUserLabRecords({
        userId: currentUser.user.id,
      });

      res.status(200).json({
        status: "ok",
        records,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/labs/:category/:scene/learning-progress",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const currentLab = await readLab(req.params.category, req.params.scene);

        if (!currentLab.ok) {
          res.status(currentLab.status).json(currentLab.body);
          return;
        }

        const variantKey = readRequiredString(req.body?.variantKey);
        const status = readRequiredString(req.body?.status);

        if (!variantKey || !status) {
          res.status(400).json({
            status: "error",
            message: "variantKey and status are required",
          });
          return;
        }

        const progress = await labRecordsService.recordLearningProgress({
          userId: currentUser.user.id,
          labKey: currentLab.lab.id,
          variantKey,
          status,
          notes: readOptionalString(req.body?.notes),
        });

        res.status(200).json({
          status: "ok",
          progress,
        });
      } catch (error) {
        if (error instanceof LabRecordError) {
          res.status(409).json({
            status: "error",
            message: error.message,
          });
          return;
        }

        next(error);
      }
    },
  );

  app.post(
    "/api/labs/:category/:scene/verification-records",
    async (req, res, next) => {
      try {
        const currentUser = await readCurrentUser(req);

        if (!currentUser.ok) {
          res.status(currentUser.status).json(currentUser.body);
          return;
        }

        const currentLab = await readLab(req.params.category, req.params.scene);

        if (!currentLab.ok) {
          res.status(currentLab.status).json(currentLab.body);
          return;
        }

        const variantKey = readRequiredString(req.body?.variantKey);
        const result = readRequiredString(req.body?.result);
        const summary = readRequiredString(req.body?.summary);

        if (!variantKey || !result || !summary) {
          res.status(400).json({
            status: "error",
            message: "variantKey, result and summary are required",
          });
          return;
        }

        const record = await labRecordsService.recordVerification({
          userId: currentUser.user.id,
          labKey: currentLab.lab.id,
          variantKey,
          result,
          summary,
          details: req.body?.details,
        });

        res.status(200).json({
          status: "ok",
          record,
        });
      } catch (error) {
        if (error instanceof LabRecordError) {
          res.status(409).json({
            status: "error",
            message: error.message,
          });
          return;
        }

        next(error);
      }
    },
  );

  app.get("/api/labs", async (_req, res, next) => {
    try {
      const items = await labRegistry.listLabs();

      res.status(200).json({
        items,
        total: items.length,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/labs/:category/:scene", async (req, res, next) => {
    try {
      const lab = await labRegistry.getLab(req.params.category, req.params.scene);

      if (!lab) {
        res.status(404).json({
          status: "error",
          message: "lab not found",
        });
        return;
      }

      res.status(200).json(lab);
    } catch (error) {
      next(error);
    }
  });

  return app;
}
