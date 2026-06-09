import { spawn } from "node:child_process";
import path from "node:path";

import { smokeRuntime } from "./config.mjs";
import { waitForCheck } from "./http-checks.mjs";

function pipeOutput(child, label) {
  child.stdout?.on("data", (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });
  child.stderr?.on("data", (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });
}

function spawnManagedService(label, command, args, options) {
  const child = spawn(command, args, {
    ...options,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  pipeOutput(child, label);

  return {
    label,
    child,
    stop() {
      if (!child.killed) {
        child.kill();
      }
    },
  };
}

async function isReady(check) {
  try {
    await waitForCheck(check, {
      timeoutMs: 2500,
      intervalMs: 250,
      requestTimeoutMs: 1500,
    });
    return true;
  } catch {
    return false;
  }
}

export async function ensureSmokeServices(checks) {
  const managedServices = [];
  const [webHomeCheck, apiHealthCheck] = checks;

  if (!(await isReady(apiHealthCheck))) {
    managedServices.push(
      spawnManagedService(
        "server",
        process.execPath,
        ["--import", "tsx", "src/index.ts"],
        {
          cwd: smokeRuntime.serverRoot,
          env: {
            ...process.env,
            PORT: "6667",
            WEB_ORIGIN: smokeRuntime.webPublicOrigin,
          },
        },
      ),
    );
  }

  if (!(await isReady(webHomeCheck))) {
    managedServices.push(
      spawnManagedService(
        "web",
        process.execPath,
        [
          path.join(smokeRuntime.webRoot, "node_modules/vite/bin/vite.js"),
          "--host",
          "127.0.0.1",
        ],
        {
          cwd: smokeRuntime.webRoot,
        },
      ),
    );
  }

  return managedServices;
}

export function stopManagedServices(services) {
  for (const service of services.reverse()) {
    service.stop();
  }
}
