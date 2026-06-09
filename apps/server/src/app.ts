import express from "express";

import { createLabRegistry } from "./services/lab-registry.js";

type DatabaseHealth = {
  status: string;
  message?: string;
};

type CreateAppOptions = {
  checkDatabaseHealth?: () => Promise<DatabaseHealth>;
  labRegistry?: ReturnType<typeof createLabRegistry>;
};

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
