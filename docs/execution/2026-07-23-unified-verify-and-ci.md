# LT-018 统一验证入口与 CI 最小门禁执行文档

## 1. 目标

按照 `SECURITY-COVERAGE-LONG-TERM-GOAL.md` 第 10.2、12.2 节和任务队列 `LT-018`，建立：

- 根级统一类型检查脚本，覆盖前后端。
- 根级统一轻量 `verify` 入口，组合类型检查、共享包测试、场景只读验证、覆盖矩阵、服务端和前端单元测试。
- 最小 CI 工作流，优先运行不依赖本机 MySQL 的静态与单元验证，禁止输出 `.env`、凭据、Cookie、token 或数据库连接秘密。

本轮不改动任何实验实现、元数据或业务代码，只新增脚本与 CI 配置。

## 2. 范围

### 2.1 本轮实施

- 在根 `package.json` 新增：
  - `typecheck:server`：服务端 `tsc --noEmit`。
  - `typecheck:web`：前端 `vue-tsc --noEmit`。
  - `typecheck`：串联前后端类型检查。
  - `verify`：串联类型检查、`test:shared`、`test:guided`、`test:coverage`、`test:server`、`test:web`（`--run`）。
- 新增 `.github/workflows/ci.yml`，在 push 与 pull_request 上运行 `pnpm install` 后的 `pnpm verify`。
- 更新 `docs/TODO.md`、主 goal 状态与完成记录。

### 2.2 明确不做

- 不在 CI 中运行依赖本机 MySQL 的集成测试、`db:prepare`、Smoke 或全量 Playwright。
- 不在 CI 输出任何环境变量、密码、token 或连接串。
- 不修改实验代码、元数据或既有测试。
- 不引入新的运行时依赖。

## 3. 设计要点

- `verify` 只包含确定性、无外部依赖的检查：类型检查、共享/服务端/前端单元测试、场景只读验证和覆盖矩阵一致性。
- 高成本、依赖环境的检查（MySQL 集成、Smoke、E2E、生产构建）保留在 `test:automation` 与发布流程，不进入日常 `verify` 与 CI 门禁。
- CI 使用 pinned 的 pnpm 与 Node 版本（与根 `packageManager` 和 `engines` 一致），只读安装依赖并执行 `verify`。
- CI 不设置任何仓库 secret，也不打印环境变量。

## 4. 安全边界

- CI 只运行本仓库内的静态检查与单元测试，不连接数据库、外部服务或真实目标。
- 不在工作流、脚本或日志中写入凭据、token、Cookie 或连接串。
- 不新增可执行攻击能力，只增加质量门禁。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| `verify` 纳入依赖 MySQL 的测试 | CI 无法在无数据库环境运行 | `verify` 只组合无外部依赖的检查，集成测试留在 `test:automation` |
| CI 泄露秘密 | 本机配置泄露 | CI 不设置 secret、不打印环境变量、不运行数据库准备 |
| 类型检查命令依赖构建产物 | CI 失败 | 类型检查用 `--noEmit`，不产出构建物；服务端 Prisma client 由安装阶段的既有类型满足 |
| pnpm/Node 版本漂移 | CI 与本机不一致 | CI 固定 pnpm 与 Node 版本，与根 `packageManager`/`engines` 对齐 |

## 6. 验证方式

- 本机运行 `pnpm verify`，确认类型检查、共享、场景、覆盖、服务端和前端单元测试全部通过。
- 校验 CI 工作流 YAML 语法与步骤顺序。
- `git diff --check` 和行尾空白检查。

## 7. 完成条件

- 根级 `typecheck`、`verify` 脚本可用并本机通过。
- CI 工作流存在且只运行无外部依赖的静态与单元验证。
- CI 不输出任何秘密。
- 文档、脚本和 CI 入口一致。

## 8. 验证结果

（实施后回填）
