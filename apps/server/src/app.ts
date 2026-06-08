import express from "express";

type DatabaseHealth = {
  status: string;
  message?: string;
};

type CreateAppOptions = {
  checkDatabaseHealth?: () => Promise<DatabaseHealth>;
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

  return app;
}
