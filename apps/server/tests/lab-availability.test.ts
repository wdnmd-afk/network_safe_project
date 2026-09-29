import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import {
  buildLabAvailabilityView,
  createLabAvailabilityService,
  isLabEnabled,
  isVariantEnabled,
  type LabAvailabilityRepositoryItem,
  type LabAvailabilityService,
} from "../src/services/lab-availability.js";

const silentLogger = {
  warn: () => {},
};

function createStubRepository(rows: LabAvailabilityRepositoryItem[]) {
  return {
    findLabAvailability: async () => rows,
  };
}

function createFailingRepository(message = "database unavailable") {
  return {
    findLabAvailability: async () => {
      throw new Error(message);
    },
  };
}

/**
 * 测试用的固定快照服务。
 *
 * 既有测试都用 createApp() 不注入依赖，默认实现会真的连库；这里显式注入，
 * 让启停相关断言不受本机数据库状态影响。
 */
function createStubAvailabilityService(
  rows: LabAvailabilityRepositoryItem[],
): LabAvailabilityService {
  return createLabAvailabilityService(createStubRepository(rows), silentLogger);
}

async function listen(app: ReturnType<typeof createApp>) {
  const server = app.listen(0);
  const address = server.address();

  assert.ok(address && typeof address === "object");

  after(() => {
    server.close();
  });

  return `http://127.0.0.1:${address.port}`;
}

test("可用性服务把数据库行转成 labKey 与变体两级映射", async () => {
  const service = createStubAvailabilityService([
    {
      labKey: "web.xss",
      isEnabled: true,
      variants: [
        { variantKey: "vuln", isEnabled: false },
        { variantKey: "fixed", isEnabled: true },
      ],
    },
    {
      labKey: "auth.idor",
      isEnabled: false,
      variants: [{ variantKey: "vuln", isEnabled: true }],
    },
  ]);

  const snapshot = await service.getSnapshot();

  assert.equal(snapshot.source, "database");
  assert.equal(isLabEnabled(snapshot, "web.xss"), true);
  assert.equal(isLabEnabled(snapshot, "auth.idor"), false);
  assert.equal(isVariantEnabled(snapshot, "web.xss", "vuln"), false);
  assert.equal(isVariantEnabled(snapshot, "web.xss", "fixed"), true);
});

test("实验级停用时其下所有变体都视为停用", async () => {
  const service = createStubAvailabilityService([
    {
      labKey: "auth.idor",
      isEnabled: false,
      variants: [
        { variantKey: "vuln", isEnabled: true },
        { variantKey: "fixed", isEnabled: true },
      ],
    },
  ]);

  const snapshot = await service.getSnapshot();

  assert.equal(isVariantEnabled(snapshot, "auth.idor", "vuln"), false);
  assert.equal(isVariantEnabled(snapshot, "auth.idor", "fixed"), false);
});

test("数据库没有登记的实验按启用处理", async () => {
  const service = createStubAvailabilityService([]);
  const snapshot = await service.getSnapshot();

  // 尚未执行 seed:labs 时表是空的，此时不能让整站不可用
  assert.equal(isLabEnabled(snapshot, "web.xss"), true);
  assert.equal(isVariantEnabled(snapshot, "web.xss", "vuln"), true);
});

test("数据库不可用时返回 metadata-fallback 且不抛出", async () => {
  const warnings: string[] = [];
  const service = createLabAvailabilityService(createFailingRepository(), {
    warn: (message: string) => {
      warnings.push(message);
    },
  });

  const snapshot = await service.getSnapshot();

  assert.equal(snapshot.source, "metadata-fallback");
  assert.equal(snapshot.labs.size, 0);
  assert.equal(snapshot.variants.size, 0);
  assert.equal(isVariantEnabled(snapshot, "web.xss", "vuln"), true);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0] ?? "", /LAB_AVAILABILITY_FALLBACK/);
});

test("可用性视图取元数据与两级启停的与运算，且不覆写元数据取值", async () => {
  const service = createStubAvailabilityService([
    {
      labKey: "web.xss",
      isEnabled: true,
      variants: [
        { variantKey: "vuln", isEnabled: false },
        { variantKey: "fixed", isEnabled: true },
      ],
    },
  ]);
  const snapshot = await service.getSnapshot();
  const lab = {
    id: "web.xss",
    variants: [
      { key: "vuln", enabled: true },
      { key: "fixed", enabled: true },
    ],
  };

  const view = buildLabAvailabilityView(lab, snapshot);

  assert.equal(view.source, "database");
  assert.equal(view.labEnabled, true);
  assert.deepEqual(view.variants, [
    { key: "vuln", enabled: false },
    { key: "fixed", enabled: true },
  ]);
  // 元数据对象本身不得被改写，否则入口一致性门禁会随管理端开关漂移
  assert.equal(lab.variants[0]?.enabled, true);
});

test("元数据未启用的变体无法被数据库重新打开", async () => {
  const service = createStubAvailabilityService([
    {
      labKey: "web.xss",
      isEnabled: true,
      variants: [{ variantKey: "vuln", isEnabled: true }],
    },
  ]);
  const snapshot = await service.getSnapshot();

  const view = buildLabAvailabilityView(
    {
      id: "web.xss",
      variants: [{ key: "vuln", enabled: false }],
    },
    snapshot,
  );

  assert.deepEqual(view.variants, [{ key: "vuln", enabled: false }]);
});

test("GET /api/labs 为每个实验附带 availability 且保留元数据 enabled", async () => {
  const app = createApp({
    labAvailabilityService: createStubAvailabilityService([
      {
        labKey: "web.xss",
        isEnabled: true,
        variants: [{ variantKey: "vuln", isEnabled: false }],
      },
    ]),
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs`);
  const body = (await response.json()) as {
    items: {
      id: string;
      variants: { key: string; enabled: boolean }[];
      availability: {
        source: string;
        labEnabled: boolean;
        variants: { key: string; enabled: boolean }[];
      };
    }[];
    total: number;
  };

  assert.equal(response.status, 200);
  assert.ok(body.items.length > 0);
  assert.equal(body.total, body.items.length);

  const xss = body.items.find((item) => item.id === "web.xss");
  assert.ok(xss, "元数据中应存在 web.xss");
  assert.equal(xss.availability.source, "database");
  assert.equal(xss.availability.labEnabled, true);
  assert.equal(
    xss.availability.variants.find((variant) => variant.key === "vuln")?.enabled,
    false,
  );
  // 元数据字段语义不变
  assert.equal(
    xss.variants.find((variant) => variant.key === "vuln")?.enabled,
    true,
  );

  // 其余实验数据库无登记，应全部放行
  const other = body.items.find((item) => item.id !== "web.xss");
  assert.ok(other);
  assert.equal(other.availability.labEnabled, true);
});

test("GET /api/labs/:category/:scene 附带 availability", async () => {
  const app = createApp({
    labAvailabilityService: createStubAvailabilityService([
      {
        labKey: "web.xss",
        isEnabled: false,
        variants: [],
      },
    ]),
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/xss`);
  const body = (await response.json()) as {
    id: string;
    availability: {
      labEnabled: boolean;
      variants: { key: string; enabled: boolean }[];
    };
  };

  assert.equal(response.status, 200);
  assert.equal(body.id, "web.xss");
  assert.equal(body.availability.labEnabled, false);
  assert.ok(body.availability.variants.every((variant) => !variant.enabled));
});

test("停用的变体接口返回 403", async () => {
  const app = createApp({
    labAvailabilityService: createStubAvailabilityService([
      {
        labKey: "auth.idor",
        isEnabled: true,
        variants: [{ variantKey: "vuln", isEnabled: false }],
      },
    ]),
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/auth/idor/vuln/read`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      orderId: "ord-1001",
    }),
  });
  const body = (await response.json()) as {
    status: string;
    message: string;
  };

  assert.equal(response.status, 403);
  assert.deepEqual(body, {
    status: "error",
    message: "lab variant disabled",
  });
});

test("启用的变体接口不被拦截（仍走原有鉴权）", async () => {
  const app = createApp({
    labAvailabilityService: createStubAvailabilityService([
      {
        labKey: "auth.idor",
        isEnabled: true,
        variants: [{ variantKey: "vuln", isEnabled: true }],
      },
    ]),
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/auth/idor/vuln/read`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      orderId: "ord-1001",
    }),
  });

  // 未登录，应由既有鉴权返回 401，而不是被启停中间件拦成 403
  assert.equal(response.status, 401);
});

test("csrf/state 这类不含变体段的路径不被误拦", async () => {
  const app = createApp({
    labAvailabilityService: createStubAvailabilityService([
      {
        labKey: "web.csrf",
        isEnabled: false,
        variants: [
          { variantKey: "vuln", isEnabled: false },
          { variantKey: "fixed", isEnabled: false },
        ],
      },
    ]),
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/csrf/state`);

  // 即使整个实验停用，state 不是变体接口，不应返回 403
  assert.notEqual(response.status, 403);
});

test("csrf/fixed/token 在 fixed 变体停用时被拦", async () => {
  const app = createApp({
    labAvailabilityService: createStubAvailabilityService([
      {
        labKey: "web.csrf",
        isEnabled: true,
        variants: [{ variantKey: "fixed", isEnabled: false }],
      },
    ]),
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/web/csrf/fixed/token`);
  const body = (await response.json()) as {
    status: string;
    message: string;
  };

  assert.equal(response.status, 403);
  assert.equal(body.message, "lab variant disabled");
});

test("learning-progress 与 verification-records 不被变体规则误拦", async () => {
  const app = createApp({
    labAvailabilityService: createStubAvailabilityService([
      {
        labKey: "web.xss",
        isEnabled: false,
        variants: [
          { variantKey: "vuln", isEnabled: false },
          { variantKey: "fixed", isEnabled: false },
        ],
      },
    ]),
  });
  const origin = await listen(app);

  for (const segment of ["learning-progress", "verification-records"]) {
    const response = await fetch(
      `${origin}/api/labs/web/xss/${segment}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          variantKey: "vuln",
          status: "completed",
        }),
      },
    );

    // 这两条路由的第三段不是变体，应由既有鉴权返回 401
    assert.equal(response.status, 401, `${segment} 不应被启停中间件拦截`);
  }
});

test("实验级停用时 workbench 被拦，变体级停用时 workbench 不被拦", async () => {
  const labDisabledApp = createApp({
    labAvailabilityService: createStubAvailabilityService([
      {
        labKey: "network.ddos",
        isEnabled: false,
        variants: [],
      },
    ]),
  });
  const labDisabledOrigin = await listen(labDisabledApp);

  const blocked = await fetch(
    `${labDisabledOrigin}/api/labs/network/ddos/workbench`,
  );
  const blockedBody = (await blocked.json()) as {
    status: string;
    message: string;
  };

  assert.equal(blocked.status, 403);
  assert.deepEqual(blockedBody, {
    status: "error",
    message: "lab disabled",
  });

  const variantDisabledApp = createApp({
    labAvailabilityService: createStubAvailabilityService([
      {
        labKey: "network.ddos",
        isEnabled: true,
        variants: [{ variantKey: "vuln", isEnabled: false }],
      },
    ]),
  });
  const variantDisabledOrigin = await listen(variantDisabledApp);

  const allowed = await fetch(
    `${variantDisabledOrigin}/api/labs/network/ddos/workbench`,
  );

  // 工作台是实验级资源，只在实验整体停用时才拦
  assert.notEqual(allowed.status, 403);
});

test("fallback 状态下所有变体接口放行", async () => {
  const app = createApp({
    labAvailabilityService: createLabAvailabilityService(
      createFailingRepository(),
      silentLogger,
    ),
  });
  const origin = await listen(app);

  const response = await fetch(`${origin}/api/labs/auth/idor/vuln/read`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      orderId: "ord-1001",
    }),
  });

  assert.equal(response.status, 401);
});
