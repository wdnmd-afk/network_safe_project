# 依赖混淆修复说明

## 1. 修复目标

依赖混淆的修复目标不是简单阻断所有外部依赖，而是让每个依赖的来源、版本、完整性和审计证据都可解释。

本项目当前通过前端固定选择器工作台、后端受控 `resolve` API 和固定样例展示修复思路，不修改真实项目依赖配置。

## 2. 核心防护点

- 私有包使用组织 scope 或明确命名空间。
- 私有 scope 固定到可信 registry。
- CI 和本机安装环境不暴露 registry token 或凭据。
- 保留 lockfile 和完整性摘要。
- 对依赖来源做审计，区分公开依赖、私有依赖和异常来源。
- 对摘要不匹配、来源不匹配或未授权 registry 解析做阻断或告警。

## 3. 当前修复版信号

当前修复版只通过固定样例返回学习信号：

- `dependency-confusion-registry-source-audited`
- `dependency-confusion-lockfile-integrity-blocked`
- `dependency-confusion-private-scope-pinned`
- `dependency-confusion-safe-public-package-accepted`
- `dependency-confusion-boundary-verified`

## 4. 日志要求

当前事件日志只能记录：

- 固定 manifest key。
- 固定 registry 场景 key。
- 固定解析策略 key。
- 解析来源类别。
- 风险标签和审计动作。
- 是否命中固定样例。
- 学习信号。

不得记录：

- 完整 manifest。
- 真实包名清单。
- 真实 registry 地址。
- `.npmrc`、token、Cookie、凭据或 CI 密钥。
- 内部组织名、本机路径或真实依赖缓存。

## 5. 生产补充说明

真实生产环境还需要结合私有包治理、CI 凭据管理、制品库权限、依赖审批、异常告警、SBOM、制品签名和供应链安全扫描。本项目当前只做本机固定样例模拟，不替代真实生产治理。
