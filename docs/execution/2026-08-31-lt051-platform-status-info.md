# LT-051 平台状态页运行与一致性信息执行文档

> 文档状态：已完成
>
> 建立时间：2026-08-31
>
> 关联任务：`LT-051`（覆盖长期目标第 7.5 节）

## 1. 目标

为平台状态页增加版本、构建信息、数据版本、目录一致性状态与最近验证摘要，且禁止泄露秘密。

## 2. 实施前确认的现状

| 项目 | 实测结论 |
|---|---|
| 状态页数据来源 | 只 `fetchLabs()` 拉 `/api/labs`，在前端聚合状态与事件 |
| 平台级状态 API | **不存在**；仅有 `/api/health` 与 `/api/health/db` |
| 服务端是否知道自身版本 | **否**；`config/runtime.ts` 只有端口解析，未读 `package.json` |
| 服务端读取的环境变量 | 6 个，含 `DATABASE_URL`、`AUTH_TOKEN_SECRET`、`MYSQL_CLI_PATH` 等敏感项 |

## 3. 一个必须澄清的措辞：「最近验证摘要」

队列条目要求「最近一次验证时间和验证结果摘要」。实施时确认**服务端无法诚实提供该信息**——它无从得知谁在何时跑过 `pnpm verify`，除非把每次验证结果持久化，而那需要新增表与写入路径，属另一个量级的改动。

可选做法与取舍：

- 伪造一个时间戳（例如进程启动时间）→ **拒绝**。这会让页面显示一个看似可信但无意义的「最近验证时间」，比不显示更糟。
- 新增持久化表记录每次 verify → 超出本切片范围，且需要 verify 主动回写，耦合过重。
- **改为返回服务端此刻能真实计算的一致性状态** → 采纳。

因此本切片交付的是「实时一致性检查」而非「历史验证记录」，并在页面上明确标注这一点：「一致性状态由服务端此刻实时计算，不是历史验证记录」。这是对原措辞的有意偏离，理由如上。

## 4. 交付内容

### 4.1 `apps/server/src/config/build-info.ts`

只暴露可安全公开的运行元信息：服务名、版本、Node 版本、环境标识、启动时间、运行时长。

关键设计：

- 版本从 `package.json` 读取。该模块在 `src/config/` 与编译后 `dist/config/` 下到 `package.json` 的相对深度一致，因此同一路径在开发与生产模式下都成立。
- 读取失败退化为 `unknown` 而非抛错，避免让整个状态接口不可用。
- **只暴露 `APP_ENV` 这一个环境标识本身，不读取也不返回任何其他环境变量取值。**

### 4.2 `GET /api/platform-info`

三段返回：

| 段 | 内容 |
|---|---|
| `build` | 服务版本、Node 版本、运行环境、启动时间、运行时长 |
| `data` | 实验数、分类数、启用变体数、Web/API 入口数、状态与模式分布 |
| `consistency` | 实时一致性状态与三类明细 |

一致性判定三条：启用变体的 `entryKey` 是否都在 Web 入口中登记、是否有启用变体的实验完全没有 Web 入口、是否仍有 `in-progress` 实验。任一不满足即为 `needs-attention`。

### 4.3 前端接入

- `apps/web/src/api/platform-info.ts`：API 客户端与类型。
- `PlatformStatusView.vue`：新增「平台运行与数据状态」章节，含一致性徽标（一致为绿、需关注为红）、六项运行与数据指标、异常明细列表，以及说明「本节只展示可公开的运行元信息与由元数据现算的统计，不含环境变量取值、凭据或本机路径」。
- 加载失败不阻断实验状态展示（与 `loadLabs` 并行且独立处理错误）。

## 5. 验证

### 5.1 端点实测

```
status: 200
build: @network-safe/server 0.1.0, v22.16.0, development
data: 78 labs / 14 categories / 156 enabledVariants / 156 web / 207 api
      statusCounts {ready: 78}, modeCounts {case-study: 30, simulation: 22, interactive: 26}
consistency: consistent, 0 missing, 0 without entry, 0 in-progress
SECRET_LEAK: none
```

所有计数与其他门禁一致（`test:coverage` 78/78、`test:entrypoints` 156/156、`test:api-entrypoints` 207/207），说明该接口与既有统计同源。

### 5.2 一致性检查有效性（注入测试）

把 `labs/web/xss/meta.json` 中一个启用变体的 `entryKey` 改为未登记值：

```
consistency: {"status":"needs-attention","labsMissingWebEntrypoint":[],
              "enabledVariantsWithoutEntry":1,"inProgressLabs":0}
```

精确捕获并计数。恢复后回到 `consistent`。

### 5.3 专用测试

`apps/server/tests/platform-info.test.ts`，4/4 通过：

- 构建与运行元信息结构与格式。
- 数据版本与注册表一致（状态分布之和、模式分布之和均等于实验总数）。
- 目录一致性状态结构，并断言当前仓库为 `consistent`。
- **秘密不泄露**：扫描 8 类禁止模式（`mysql://`、`password`、三个敏感变量名、Windows 绝对路径、`/home/`、`/Users/`），并逐一确认真实环境变量取值未进入响应。

该接口无需登录即可访问，因此秘密不泄露是硬性要求。测试中断言计数关系而非硬编码具体数量，避免实验增长时产生无谓维护成本。

### 5.4 回归

`pnpm verify` EXIT=0；`test:api-entrypoints` 仍 `ok: true`（`/api/platform-info` 属平台级路由，不在实验路由校验范围内，`routeCount` 由 81 增至 86）。

## 6. 安全边界

- 只返回版本号、Node 版本、`APP_ENV` 标识、时间戳与由元数据现算的计数。
- 不读取也不返回 `DATABASE_URL`、`AUTH_TOKEN_SECRET`、`MYSQL_CLI_PATH` 或任何其他环境变量取值。
- 不暴露任何本机绝对路径。
- 不返回用户数据、事件日志内容或凭据。
- 秘密不泄露由自动化测试强制，而非仅靠代码审阅。

## 7. 完成标准

- [x] 核实状态页现状与平台级 API 缺失。
- [x] 澄清「最近验证摘要」无法诚实提供，改为实时一致性状态并在页面标注。
- [x] 新增构建信息模块，兼容 `src` 与 `dist` 两种运行形态。
- [x] 新增 `/api/platform-info`，三段返回。
- [x] 前端 API 客户端与状态页章节落地。
- [x] 一致性检查经注入测试验证有效。
- [x] 秘密不泄露由自动化测试强制，4/4 通过。
- [x] `pnpm verify` EXIT=0。
- [x] 长期目标、TODO 同步。
- [x] `git diff --check` 通过并提交。

## 8. 第 7.5 节条目对应关系

| 条目 | 本切片处置 |
|---|---|
| 增加版本、构建信息和数据版本显示 | 已完成 |
| 增加实验目录一致性状态 | 已完成（实时计算，三类判定） |
| 增加最近一次验证时间和验证结果摘要 | **有意偏离**：改为实时一致性状态，理由见第 3 节 |
| 增加数据库迁移状态和种子状态检查 | 迁移状态已由 `LT-049` 的 `pnpm db:status` 提供（命令行）；未接入状态页，见第 9 节 |
| 增加只面向本机维护者的诊断信息，禁止泄露秘密 | 已完成，且由测试强制 |

## 9. 遗留

- 迁移状态未接入状态页。`pnpm db:status` 已能提供该信息，但把它接入 HTTP 接口意味着一个未登录可访问的端点会连接数据库并暴露迁移名称，需要先确定是否加鉴权。建议单独评估而不是顺手加上。
- 种子状态（认证账号与实验元数据是否已写入）未纳入。它需要查询数据库，与迁移状态同属一类决策。
