import { spawn } from "node:child_process";
import path from "node:path";

import { e2eRuntime, serviceChecks } from "./runtime.mjs";
import { isReachable, waitForUrl } from "./health.mjs";

// 与主项目 packages/testing/src/smoke/services.mjs 同构：
// 已就绪的服务不再拉起，测试结束后只关闭本进程拉起的那些。

function pipeOutput(child, label) {
  child.stdout?.on("data", (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });
  child.stderr?.on("data", (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });
}

function spawnManagedService(label, args, options) {
  const child = spawn(process.execPath, args, {
    ...options,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  pipeOutput(child, label);

  // 子进程意外退出时留痕：否则只看到「等待服务就绪超时」，无法判断是没起来还是起来又挂了
  child.on("exit", (code, signal) => {
    console.log(`[${label}] 进程退出 code=${code} signal=${signal ?? "none"}`);
  });
  child.on("error", (error) => {
    console.log(`[${label}] 进程启动失败：${error.message}`);
  });

  return {
    label,
    stop() {
      if (!child.killed) {
        child.kill();
      }
    },
  };
}

function viteBin(root) {
  return path.join(root, "node_modules/vite/bin/vite.js");
}

export async function ensureE2eServices() {
  const services = [];
  const [mainServer, mainWeb, adminServer, adminWeb] = serviceChecks;

  if (!(await isReachable(mainServer.url))) {
    services.push(
      spawnManagedService("main-server", ["--import", "tsx", "src/index.ts"], {
        cwd: e2eRuntime.mainServerRoot,
        env: {
          ...process.env,
          PORT: "6667",
          WEB_ORIGIN: "http://localhost:6670",
        },
      }),
    );
  }

  if (!(await isReachable(mainWeb.url))) {
    services.push(
      spawnManagedService(
        "main-web",
        [viteBin(e2eRuntime.mainWebRoot), "--host", "127.0.0.1"],
        { cwd: e2eRuntime.mainWebRoot },
      ),
    );
  }

  if (!(await isReachable(adminServer.url))) {
    services.push(
      spawnManagedService("admin-server", ["--import", "tsx", "src/index.ts"], {
        cwd: e2eRuntime.adminServerRoot,
        env: {
          ...process.env,
          ADMIN_SERVER_HOST: "127.0.0.1",
          ADMIN_SERVER_PORT: "6681",
          MAIN_SITE_ORIGIN: "http://127.0.0.1:6667",
        },
      }),
    );
  }

  if (!(await isReachable(adminWeb.url))) {
    services.push(
      spawnManagedService(
        "admin-web",
        [viteBin(e2eRuntime.adminWebRoot), "--host", "127.0.0.1"],
        { cwd: e2eRuntime.adminWebRoot },
      ),
    );
  }

  for (const check of serviceChecks) {
    await waitForUrl(check.url);
  }

  return services;
}

export function stopManagedServices(services) {
  for (const service of services.reverse()) {
    service.stop();
  }
}
