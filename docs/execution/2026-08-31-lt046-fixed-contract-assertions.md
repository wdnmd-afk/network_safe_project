# LT-046 前后端固定契约一致性断言执行文档

> 对应长期目标：`LT-046`
>
> 文档状态：已完成
>
> 创建时间：2026-08-31

## 1. 背景

第四轮审计（`LT-045`）确认了一类系统性验证盲区。

78 个专项 `verify.ts` 采用同一模式：把服务端服务、前端 API 客户端、前端 labs 模块、路由文件等读成文本后 `join("\n")` 得到 `combinedImplementation`，再断言若干关键片段"是否出现在其中"。

这种存在性检查对**不一致缺陷天生无效**：只要服务端写了正确值，拼接后的字符串就包含该片段，检查通过；前端同一常量写错什么值都无人对照。

`LT-042` 的实际后果证明了这一点。`apps/web/src/labs/kubernetes-rbac-audit.ts` 中四个固定 key 与服务端不一致：

| 前端（错误） | 服务端（权威） |
|---|---|
| `fixed-kubernetes-rbac-binding-audit` | `fixed-kubernetes-rbac-audit` |
| `accept-cluster-wide-wildcard-binding` | `accept-cluster-admin-binding` |
| `approve-cluster-admin-binding` | `approve-overbroad-binding` |
| `block-cluster-admin-binding` | `block-overbroad-binding` |

该实验的漏洞版与防御版在浏览器中从未成功运行过——点击"载入推荐路径"再提交，服务端一律返回边界阻断，页面只显示"未登记输入被脱敏阻断"。它带着这个缺陷通过了 `LT-042` 的专项验证、根级 `pnpm verify`、Web/API 入口门禁并进入提交，最终由 `b73ec4a` 补 E6 时才被 Playwright 暴露。

本任务的目标不是修某一个实验，而是**建立一种能捕获这类缺陷的验证机制**。

## 2. 范围

### 2.1 纳入范围

- 新增独立契约验证器，真实导入前后端模块并比对运行时值。
- 覆盖 scenarioKey、optionKey、推荐路径可达性、信号常量、信号标签映射。
- 纳入根级 `pnpm verify` 门禁。
- 用 `LT-042` 原始缺陷值做注入测试，证明该验证器确实能捕获。

### 2.2 不纳入范围

- 不改写 78 个既有 `verify.ts` 的内部实现（推广与去重属 `LT-047`）。
- 不修改任何实验的业务逻辑、固定数据或安全边界。
- 不新增实验、不改动元数据。

## 3. 已确认的现状事实

以下均在实现前实测确认，不属推测：

| 项目 | 确认值 | 来源 |
|---|---|---|
| 专项验证器总数 | 78 | `tools/lab-scripts/**/verify.ts` 计数 |
| 真正 `import` 前端模块的验证器 | 0 | 抽样核对，`apps/web/src/labs/` 仅作为字符串路径出现在 `implementationFiles` |
| 比对 `recommendedPath` 的验证器 | 0 | 全量检索 |
| `apps/web/src/labs/` 模块数 | 49 | 目录清点 |
| 导出 `recommendedPath` 的前端模块 | 18 | 全量检索 |
| 命名规律 | web `labs/<slug>.ts` ↔ server `services/<slug>-lab.ts` | 抽样核对 6 组，导出常量同名 |
| 两侧模块可否直接 `import` | 可以 | 实测 `kubernetes-rbac-audit` 两侧导出键 |

`controlled-decision-labs.ts` 是 4 个受控实验共享的配置模块，与其余「一实验一模块」形态不同，单独登记配对。

## 4. 设计决策

### 4.1 为何新建独立验证器而非逐个改 78 个文件

逐个改动会把同一断言逻辑复制 78 份，且新增实验时极易漏写——这正是当前盲区的成因。独立验证器只需一处维护，配对表集中登记，新增实验时缺失配对可被显式发现。

### 4.2 断言什么

对每个配对实验断言五类：

| 断言 | 含义 |
|---|---|
| `scenario-key-equal` | 前后端 scenarioKey 运行时值严格相等 |
| `option-keys-registered` | 前端各路径中每个 optionKey 都在服务端状态机中已注册 |
| `path-reaches-terminal` | 按前端固定路径逐步提交能走到终止步骤，不被脱敏阻断 |
| `signal-constants-equal` | 前后端信号常量值相等 |
| `signal-labels-cover` | 前端信号标签映射覆盖服务端全部 canonical 信号 |

`path-reaches-terminal` 是核心：它等价于断言「页面按推荐路径提交后不会被服务端拒绝」，即 `LT-042` 缺陷的直接症状。

### 4.3 为何只覆盖 17 组配对

只有持有独立路径副本的实验才存在前后端不一致的可能。其余实验的决策 key 完全由服务端工作台响应驱动，前端不持有副本，结构上无从不一致。强行给它们编造配对只会产生噪声断言。

## 5. 实施步骤

1. 摸清前后端模块命名规律与导出形态，确认可直接 `import`。
2. 建立 `tools/contracts/verify-fixed-contracts.ts`，集中登记配对表与五类断言。
3. 运行验证器，确认全部配对通过。
4. **注入测试**：把 `LT-042` 的四个原始错误值写回前端模块，确认验证器失败并给出精确定位。
5. 恢复文件，确认验证器回到全绿且工作区无残留改动。
6. 纳入根级 `pnpm verify` 门禁。
7. 运行完整根级验证。

## 6. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 验证器"全绿"但实际无效 | 盲区未被真正修复，且产生虚假信心 | 强制注入测试，必须先看到它失败再看到它通过 |
| 导入前端模块引入 Vue 运行时依赖 | 验证器无法在 Node 下运行 | labs 模块为纯 TS 常量与函数，实测可直接导入 |
| 配对表漏登记新实验 | 新实验不受契约保护 | 缺失配对时报错而非静默跳过；`LT-047` 补强制校验 |
| 注入测试污染工作区 | 错误值被误提交 | 注入后立即恢复，并用 `git diff` 确认为空 |
| 状态机推进逻辑与真实 API 不一致 | 断言结论不可信 | 直接复用服务端 `createGuidedScenarioMachine`，不另写模拟 |

## 7. 安全边界

- 只导入仓库内模块并比对内存常量，不发起 HTTP 请求。
- 不连接数据库、不执行系统命令、不读取任何凭据或环境变量。
- 不新增攻击能力；本任务只验证前后端契约一致性。
- 注入测试只在本机临时修改前端常量，立即恢复且不提交。

## 8. 完成标准

- [x] 契约验证器建立，真实导入前后端模块比对运行时值。
- [x] 覆盖 scenarioKey、optionKey、路径可达性、信号常量、信号标签五类断言。
- [x] 全部配对通过。
- [x] 注入测试证明验证器能捕获 `LT-042` 原始缺陷。
- [x] 注入后工作区完全恢复。
- [x] 纳入根级 `pnpm verify` 门禁。
- [x] 根级验证 EXIT=0。
- [x] 长期目标、TODO 同步。
- [x] `git diff --check` 通过并提交。

## 9. 验收证据

### 9.1 契约验证器

`pnpm test:contracts` EXIT=0：

```
scope: local-repository-only
ok: true
pairingCount: 17
checkCount: 153
failedCount: 0
```

17 组配对、153 项断言全部通过。

### 9.2 注入测试（关键证据）

把 `LT-042` 的四个原始错误值写回 `apps/web/src/labs/kubernetes-rbac-audit.ts` 后，验证器立即失败：

```
ok: false
failedCount: 2

infrastructure.kubernetes-rbac-audit
  option-keys-registered:vuln.recommendedPath
    vuln.recommendedPath 含服务端未注册的 optionKey：
    accept-cluster-wide-wildcard-binding, approve-cluster-admin-binding

infrastructure.kubernetes-rbac-audit
  path-reaches-terminal:vuln.recommendedPath
    路径被阻断：completed=false blockedReason=option-not-allowed
```

两条断言都精确命中，并直接指出了未注册的 key 名与阻断原因。这是既有 78 个存在性检查全部漏掉的缺陷。

恢复文件后验证器回到 `ok: true`、17 配对、153 检查、0 失败；`git diff` 为空，工作区无残留。

### 9.3 门禁与根级验证

`test:contracts` 已插入 `verify` 链，位于 `test:controlled` 之后、`test:entrypoints` 之前。

根级 `pnpm verify` EXIT=0：前后端类型检查通过、shared 67、guided 30/30、controlled 7×`ok: true`、contracts 17 配对 153 检查、Web 入口 156/156、API 入口 207/207、coverage 78/78、server 390/390、web 285/285。

## 10. 交付物

- 本执行文档与验收证据。
- `tools/contracts/verify-fixed-contracts.ts` 契约验证器。
- `package.json` 新增 `test:contracts` 并纳入 `verify` 链。
- 长期目标与 TODO 的 `LT-046` 完成记录。

## 11. 遗留与后续

- 本验证器只覆盖 17 组持有独立路径副本的实验；`LT-047` 负责建立「新增专用实验必须登记配对」的强制校验，并清理 78 个既有验证器中被本机制取代的存在性检查。
- 既有 78 个 `verify.ts` 的存在性检查未删除。它们对文档一致性、文件存在性、禁用能力扫描仍有价值，只是不应再被当作契约一致性证据。
