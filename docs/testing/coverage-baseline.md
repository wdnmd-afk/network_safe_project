# 测试覆盖率基线与失败排障说明

> 文档状态：持续维护
>
> 首次建立：2026-08-31（`LT-052`）
>
> 关联长期目标：第 10.2 节「建立测试覆盖率基线，先观察再决定门禁阈值」与「建立失败证据、日志位置和排障说明」

## 1. 本文档的定位

本文档记录覆盖率的**测量方式与观测基线**，不设门禁阈值。

长期目标第 10.2 节明确要求「先观察再决定门禁阈值」。在只有一次测量的情况下设阈值是凭空取数：过低无约束力，过高会立刻阻塞正常开发。因此当前只提供命令与基线，阈值待多轮观测后再定。

## 2. 覆盖率命令

| 命令 | 范围 | 工具 |
|---|---|---|
| `pnpm coverage:server` | 服务端单元与 API 测试 | Node 22 内置 `--experimental-test-coverage` |
| `pnpm coverage:web` | 前端单元测试 | `@vitest/coverage-v8` |
| `pnpm coverage` | 两者依次执行 | — |

这些命令**不在 `pnpm verify` 中**。覆盖率测量比普通测试慢，且当前无阈值可判定通过与否，放进门禁只会拖慢每次验证而不产生判据。

关于工具选择：服务端用 Node 内置能力，无需新依赖。前端的 vitest 必须配套 `@vitest/coverage-v8` 才能出覆盖率，这是本轮唯一新增依赖，仅开发期使用，版本与已装 vitest 2.1.9 精确对齐。

## 3. 观测基线（2026-08-31 首次测量）

### 3.1 服务端

```
# tests 394
# pass 394
# fail 0
all files | 72.65 (行) | 81.11 (分支) | 70.52 (函数)
```

### 3.2 前端

```
Test Files  80 passed (80)
Tests  285 passed (285)
All files | 31.01 (行) | 79.11 (分支) | 58.94 (函数) |
```

## 4. 前端行覆盖率偏低的真实原因

31.01% 这个数字容易被误读为「前端测试很差」，实际原因是**测试类型与覆盖统计范围不匹配**：

- 现有 285 个前端测试针对 `src/labs/*.ts`（固定契约与格式化函数）与 `src/api/*.ts`（请求构造与响应处理）。
- `src/views/*.vue` 共约 50 个组件文件全部为 **0%**——没有任何组件渲染测试。这些文件动辄数百行，把整体行覆盖率大幅拉低。
- 组件行为实际由 **Playwright E2E** 覆盖（31 个实验具备 E6 三向页面验证），但 E2E 不参与 vitest 覆盖率统计。

因此 31.01% 反映的是「vitest 单测未覆盖 Vue 组件」，不等于「组件未被验证」。分支覆盖率 79.11% 与函数覆盖率 58.94% 更能反映被测代码的实际质量。

若将来要提高这个数字，正确路径是二选一：把 `.vue` 排除出覆盖统计范围（让数字只反映单测目标），或补组件渲染测试。前者是统计口径调整，后者是真实增量——不应混为一谈。

## 5. 设定阈值前需要先回答的问题

1. 统计范围是否应排除 `src/views/*.vue`？在补齐组件测试前，包含它们会让阈值实质上由「视图代码总行数」决定，而非测试质量。
2. 服务端 70.52% 的函数覆盖率中，未覆盖部分是否集中在引导式实验的相似分支上？若是，逐个补测的边际价值低。
3. 阈值应针对整体还是分目录？整体阈值容易被大文件稀释。
4. 至少需要几轮观测才能确认基线稳定？单次测量无法区分「当前水平」与「偶然波动」。

## 6. 失败证据与日志位置

### 6.1 各类验证的输出位置

| 验证 | 命令 | 失败证据位置 |
|---|---|---|
| 类型检查 | `pnpm typecheck` | 终端输出，含文件路径与行号 |
| 服务端测试 | `pnpm test:server` | 终端 TAP 输出，失败项含 `location` 与 `error` |
| 前端测试 | `pnpm test:web:run` | 终端输出，含 diff 与堆栈 |
| 前后端契约一致性 | `pnpm test:contracts` | 终端 JSON，`failed[]` 含 `labKey`／`key`／`message` |
| 数据库结构一致性 | `pnpm test:db-schema` | 终端 JSON，`failed[]` 含具体表名与列名 |
| 入口一致性 | `pnpm test:entrypoints`／`test:api-entrypoints` | 终端 JSON，`errors[]` |
| 覆盖矩阵 | `pnpm test:coverage` | 终端 JSON，`errors[]` |
| 迁移状态 | `pnpm db:status` | 终端文本，含 `state` 与 `hint` |
| Playwright E2E | `pnpm test:e2e` | 终端输出 + `%TEMP%\network-safe-playwright-results\` 下的 `error-context.md` |

### 6.2 排障顺序建议

1. **先看是否为环境问题而非代码问题。** 依赖刚被重装过时，Prisma 客户端路径哈希会变化，导致大量测试以 `@prisma/client did not initialize yet` 失败。此时先跑 `pnpm --filter @network-safe/server prisma:generate`，不要逐个排查测试。
2. **区分「全部失败」与「个别失败」。** 全部失败通常是环境、依赖或数据库问题；个别失败才是代码问题。
3. **用 JSON 型验证器定位具体对象。** `test:contracts` 与 `test:db-schema` 的失败信息直接给出实验名、key 名、表名与列名，不需要额外挖掘。
4. **Playwright 失败先看 `error-context.md`。** 它记录了失败时刻的页面状态，比只读终端堆栈更快定位。

### 6.3 已知的环境类失败模式

| 现象 | 原因 | 处置 |
|---|---|---|
| 大量服务端测试报 `@prisma/client did not initialize yet` | 依赖重装后 Prisma 客户端路径变化 | `pnpm --filter @network-safe/server prisma:generate` |
| `ERR_PNPM_LOCKFILE_BREAKING_CHANGE` | lockfile 版本与 pnpm 版本不匹配 | 见 `LT-050` 执行文档；当前 lockfile 为 v9、对应 pnpm 10 |
| 数据库相关测试失败 | MySQL 未运行或 `DATABASE_URL` 不可连通 | `pnpm db:status` 先确认可达性 |
| 迁移脚本报找不到 mysql | MySQL 不在 `PATH` | 设置 `MYSQL_CLI_PATH` |
| Playwright 端口占用 | 6667／6670 被占用 | `netstat -ano \| findstr :6667` 后结束占用进程 |

## 7. 后续维护

每次显著改动测试结构或依赖后，建议重跑 `pnpm coverage` 并在本文档追加一行观测记录。积累三轮以上再讨论阈值。
