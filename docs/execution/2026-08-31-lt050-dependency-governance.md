# LT-050 依赖与版本治理执行文档

> 文档状态：已完成
>
> 建立时间：2026-08-31
>
> 关联任务：`LT-050`（覆盖长期目标第 12.3 节）

## 1. 目标

建立依赖与版本治理基线，核心是解决 `packageManager` 声明 `pnpm@10.0.0` 与 `pnpm-lock.yaml` 的 `lockfileVersion: 5.4`（pnpm 7 格式）之间的矛盾。

## 2. 该矛盾的真实严重性远超此前判断

`LT-041` 至 `LT-049` 期间我多次记录该矛盾为「已知遗留项、不影响交付」，依据是「corepack pnpm@10 实测可正常解析该 lockfile 且不改写它」。

**这个判断是错的。** 本切片实测：

```
$ pnpm install --frozen-lockfile
Scope: all 5 workspace projects
 ERR_PNPM_LOCKFILE_BREAKING_CHANGE  Lockfile pnpm-lock.yaml not compatible with current pnpm
Run with the --force parameter to recreate the lockfile.
```

pnpm 10 **直接拒绝** v5.4 lockfile，不是「可以解析」。此前之所以看起来正常，是因为 `node_modules` 早已由 pnpm 7 装好——脚本能跑，但那不代表能安装。

真实影响：

- **全新克隆无法安装依赖**，交付链在第一步即断。
- **CI 对全新运行是坏的**：`.github/workflows/verify.yml` 用 `pnpm/action-setup@v4` 指定 10.0.0，随后执行 `pnpm install --frozen-lockfile`，与本地复现的失败路径完全一致。CI 每次都从干净环境开始，因此不存在「node_modules 已就绪」这个掩盖条件。
- `LT-048` 写入 README 的说明因此也是错的，已在本切片纠正。

先前判断错误的根源：我用「脚本能跑」验证了「依赖可用」，却把它当成了「安装可复现」的证据。二者在已有 `node_modules` 的机器上无法区分，必须显式测 `--frozen-lockfile`。

另一处观察：`LT-041` 记录本机 pnpm 为 7.33.7，本切片实测已是 10.0.0，环境在此期间变过。这也说明依赖此类"当时记录"的结论需要重新验证而不能直接沿用。

## 3. 处置

### 3.1 重建 lockfile 为 v9

```
$ pnpm install --lockfile-only
Done in 54.4s
$ head -1 pnpm-lock.yaml
lockfileVersion: '9.0'
```

选择重建而非降级 `packageManager` 声明，理由：

- 本机与 CI 都已是 pnpm 10，降级声明会让两侧都需要额外安装旧版本。
- v5.4 是 pnpm 7 格式，继续保留意味着长期锁定在已不使用的版本上。
- 重建后声明、lockfile 与实际执行版本三者一致，不再需要 corepack 变通。

### 3.2 验证全新安装真正可行

重建后重跑 CI 使用的完全相同命令：

```
$ pnpm install --frozen-lockfile --config.confirmModulesPurge=false
Done in 1m 58s
frozen-exit=0
```

该次安装重建了整个 `node_modules`（252 个包），因此结论不受旧 `node_modules` 影响。

### 3.3 处理 pnpm 10 的构建脚本策略变更

重装时 pnpm 10 报告：

```
The following dependencies have build scripts that were ignored:
@prisma/client, @prisma/engines, esbuild, prisma
```

pnpm 10 默认不再执行依赖的构建脚本。实测确认这不影响本项目：

| 检查 | 结果 |
|---|---|
| tsx / esbuild 可用 | `tsx -e 'console.log("tsx ok")'` 输出 `tsx ok` |
| Prisma 客户端可生成 | `prisma:generate` 成功，v6.19.3 |

Prisma 客户端由显式的 `prisma:generate` 脚本生成，不依赖 postinstall；esbuild 二进制随包分发。

尽管当前不受影响，仍在 `package.json` 中显式登记 `pnpm.onlyBuiltDependencies`，避免将来 pnpm 行为再变时静默失败。实测该字段不进入 lockfile 的 `settings` 段，加入后 `--frozen-lockfile` 仍报 `Already up to date`。

### 3.4 补齐 CI 缺失的门禁

发现 CI 未包含本轮新增的两道门禁，已补入 `test:contracts` 与 `test:db-schema`，位置与 `pnpm verify` 链一致。这意味着 `LT-046`／`LT-047`／`LT-049` 建立的检查此前只在本地生效。

### 3.5 纠正 README 的错误说明

`LT-048` 写入的「实测可正常解析该 lockfile 且不会改写它」为错误结论，已改为准确描述：声明与 lockfile 现已一致，corepack 仅在本机版本不符时作为兜底。同时把命令块中 15 处 `corepack pnpm@10.0.0` 前缀简化为 `pnpm`——变通已无必要。

## 4. 回归验证

依赖被完整重建，因此必须验证全量门禁：

`pnpm verify` EXIT=0（typecheck、shared 67、guided 30/30、controlled 7×`ok`、contracts 17 组 170 断言、db-schema 15 项、Web 入口 156/156、API 入口 207/207、coverage 78/78、server 390/390、web 285/285）。

## 5. 安全边界

- 只改动 lockfile、`package.json` 的 pnpm 字段、CI 工作流与 README。
- 未改动任何依赖版本范围：`--lockfile-only` 依据现有 `package.json` 的版本声明重解析，不做升级。
- 未引入新依赖。
- 未在任何文档或提交中写入凭据。

## 6. 完成标准

- [x] 查清 pnpm 版本矛盾的真实影响面（全新安装与 CI 均失败）。
- [x] lockfile 重建为与声明匹配的 v9。
- [x] 用 CI 相同命令验证全新安装成功。
- [x] 处理 pnpm 10 构建脚本策略变更并实测工具链可用。
- [x] 补齐 CI 缺失的两道门禁。
- [x] 纠正 `LT-048` 写入 README 的错误说明。
- [x] 依赖重建后全量 `pnpm verify` EXIT=0。
- [x] 长期目标、TODO 同步。
- [x] `git diff --check` 通过并提交。

## 7. 第 12.3 节条目对应关系

| 条目 | 本切片处置 |
|---|---|
| 建立 Node、pnpm、Vue、Express、Prisma 和测试工具版本检查 | 部分完成：Node 由 `engines` 约束、pnpm 由 `packageManager` 与 lockfile 版本共同约束且 CI 显式指定；Vue／Express／Prisma 仍只由 `package.json` 版本范围约束，无独立检查 |
| 建立依赖升级记录和兼容性验证流程 | 本文档记录了本次 lockfile 重建的完整过程与验证方式，可作为后续升级的参照；未建立独立的升级记录文件 |
| 建立依赖风险审计和误报处置记录 | **未完成**，见第 8 节 |
| 非必要不引入新依赖，优先复用现有能力 | 已是既有规则（`AGENTS.md` 第 11 节），本切片未引入新依赖 |
| 定期清理无用脚本、旧生成产物和失效文档入口 | **未完成**，见第 8 节 |

## 8. 遗留

- 依赖风险审计（如 `pnpm audit`）与误报处置记录未建立。它需要先确定「哪些告警在本机学习项目语境下可接受」的判定口径，否则会产生大量无法处置的噪声，建议单独立项。
- 无用脚本与失效文档入口的清理未做。这需要先建立"失效"的判定标准（例如文档引用的路径是否仍存在），本身即是一项检查工作。
- Vue／Express／Prisma 的版本一致性无独立检查，当前只靠 `package.json` 的版本范围与 lockfile 锁定。
