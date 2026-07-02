# 依赖混淆

## 场景目标

本实验用于学习供应链中的依赖混淆风险：私有包名与公共包名冲突、scope 缺失、registry 解析优先级不清晰、lockfile 缺失和安装源审计不足，都可能让依赖解析链路偏向错误来源。

当前状态为 `in-progress`，已建立标准目录、元数据、文档入口、前端固定选择器工作台、后端受控 `resolve` API、Playwright 页面级差异验证和本机只读一致性验证。这里的 in-progress 不表示已经存在攻击脚本、安装流程、registry 连接或包发布能力，也不表示已完成 ready 收口。

## 当前范围

- 已建立 `supply-chain.dependency-confusion` 元数据。
- 已建立漏洞版 / 修复版说明目录。
- 已建立攻击方观察、修复说明和手动验证文档。
- 已接入前端固定选择器工作台：`/labs/supply-chain/dependency-confusion/vuln`、`/labs/supply-chain/dependency-confusion/fixed`。
- 已接入后端受控固定解析 API：`POST /api/labs/supply-chain/dependency-confusion/:variant/resolve`。
- API 只读取固定 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`，并写入统一事件日志安全摘要。
- 已接入 Playwright 页面级差异验证，覆盖漏洞版错误公共来源选择、修复版私有 scope 固定、修复版完整性阻断和正常公开依赖审计放行。
- 已接入本机只读一致性验证脚本：`tools/lab-scripts/supply-chain/dependency-confusion/verify.ts`。
- 元数据当前登记 docs、web、api 和只读 scripts 入口。
- 当前不运行真实依赖安装，不访问真实 registry，不发布真实包，不创建生命周期脚本。

## 固定样例方向

后续只允许固定 key：

- `unscoped-internal-name`：观察未使用 scope 的内部依赖名如何产生同名风险。
- `scoped-private-package`：观察私有 scope 与可信 registry 绑定后的解析收敛。
- `mixed-source-review`：观察公开依赖和私有依赖混合时的来源审计。

固定伪 registry 场景：

- `public-name-collision`：伪公共来源存在同名更高版本包。
- `private-scope-pinned`：私有 scope 被固定到可信来源。
- `lockfile-integrity-mismatch`：固定 lockfile 摘要与伪元数据不一致。

这些样例只作为学习标签、API 固定 key 和风险说明使用，不连接真实包生态。

## 当前 API 入口

当前 API 为：

```text
POST /api/labs/supply-chain/dependency-confusion/:variant/resolve
```

请求体只允许固定字段：

- `manifestKey`
- `registryScenarioKey`
- `resolutionPolicyKey`

漏洞版用于观察错误来源选择和 scope 缺失风险，修复版用于观察私有来源固定、来源审计、lockfile 完整性阻断和正常公开依赖可接受路径。

API 不读取任何额外字段。即使请求体携带真实包名、registry URL、`.npmrc`、token 或 lockfile 内容，也不会进入解析流程或事件日志摘要。

## 当前前端入口

当前页面入口为：

```text
/labs/supply-chain/dependency-confusion/vuln
/labs/supply-chain/dependency-confusion/fixed
```

页面只提供固定 manifest、固定伪 registry 场景和固定解析策略选择器。页面不提供任意包名、真实 registry 地址、`.npmrc`、token、lockfile、安装命令、发布命令或生命周期脚本输入。

## 安全边界

- 不运行真实依赖安装、登录、下载、打包或发布命令。
- 不访问真实 npm、pnpm、PyPI、Maven、私有 registry 或镜像源。
- 不发布真实包。
- 不创建真实投毒包、包归档、发布脚本或生命周期脚本。
- 不读取 `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token、registry 凭据、CI 凭据或真实依赖缓存。
- 不保存完整 manifest、真实包名清单、真实 registry 地址、token、Cookie、凭据、内部组织名或本机路径。
- 不提供 `exploit.py`。

## 后续切片

1. 按 simulation ready 标准收口。
