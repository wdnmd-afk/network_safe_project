# 来源审计复盘版

## 目标

本变体用于学习依赖混淆的修复与审计思路：通过 scope 约束、私有 registry 绑定、lockfile、完整性校验和安装源审计，让依赖解析来源可解释、可复核、可阻断。

当前为 `ready`：前端已提供固定选择器工作台，后端已提供受控 `resolve` API，Playwright 已覆盖私有 scope 固定、完整性阻断和正常公开依赖审计放行页面信号，并已提供本机只读一致性验证脚本；ready 只代表本项目内固定样例学习闭环完成，仍不存在攻击脚本或真实包生态连接能力。

## 当前复盘方式

前端入口：

```text
/labs/supply-chain/dependency-confusion/fixed
```

修复版 API 只允许使用固定样例 key：

- 固定 `manifestKey`
- 固定 `registryScenarioKey`
- 固定 `resolutionPolicyKey`

当前 API 可展示：

- 私有 scope 如何绑定可信来源。
- lockfile 与完整性摘要如何支持复核。
- 异常来源或摘要不匹配时如何阻断。
- 正常公开依赖如何继续可用。

当前可观察信号：

- `dependency-confusion-registry-source-audited`
- `dependency-confusion-lockfile-integrity-blocked`
- `dependency-confusion-private-scope-pinned`
- `dependency-confusion-safe-public-package-accepted`

页面级验证已确认修复版固定样例会展示 `private-registry` / `trusted` / `pinned` / `verified` 私有来源固定路径、`blocked-audit` / `blocked` / `mismatch` 完整性阻断路径，以及 `mixed-audited` / `audited` 正常公开依赖审计放行路径。

当前入口：

```text
POST /api/labs/supply-chain/dependency-confusion/fixed/resolve
```

前端页面只会向该接口提交 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`，不提交真实包名、registry 地址、`.npmrc`、token、lockfile、安装命令或发布命令。

## 禁止能力

- 不读取真实 registry 配置或凭据。
- 不修改真实项目依赖。
- 不写入 `node_modules`、全局包目录或依赖缓存。
- 不生成真实包内容、发布脚本或生命周期脚本。
- 不提供攻击脚本。
