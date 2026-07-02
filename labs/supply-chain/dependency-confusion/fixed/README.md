# 来源审计复盘版

## 目标

本变体用于学习依赖混淆的修复与审计思路：通过 scope 约束、私有 registry 绑定、lockfile、完整性校验和安装源审计，让依赖解析来源可解释、可复核、可阻断。

当前仅为 `planned` 文档说明，不存在页面、API 或脚本入口。

## 后续复盘方式

后续修复版只允许使用固定样例 key：

- 固定 `manifestKey`
- 固定 `registryScenarioKey`
- 固定 `resolutionPolicyKey`

后续页面和 API 应展示：

- 私有 scope 如何绑定可信来源。
- lockfile 与完整性摘要如何支持复核。
- 异常来源或摘要不匹配时如何阻断。
- 正常公开依赖如何继续可用。

## 后续预期信号

- `dependency-confusion-registry-source-audited`
- `dependency-confusion-lockfile-integrity-blocked`
- `dependency-confusion-private-scope-pinned`
- `dependency-confusion-safe-public-package-accepted`

## 禁止能力

- 不读取真实 registry 配置或凭据。
- 不修改真实项目依赖。
- 不写入 `node_modules`、全局包目录或依赖缓存。
- 不生成真实包内容、发布脚本或生命周期脚本。
- 不提供攻击脚本。
