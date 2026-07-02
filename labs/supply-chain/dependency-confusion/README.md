# 依赖混淆

## 场景目标

本实验用于学习供应链中的依赖混淆风险：私有包名与公共包名冲突、scope 缺失、registry 解析优先级不清晰、lockfile 缺失和安装源审计不足，都可能让依赖解析链路偏向错误来源。

当前状态为 `planned`，只建立标准目录、元数据和文档入口。这里的 planned 不表示已经存在页面、API、脚本、安装流程或包发布能力。

## 当前范围

- 已建立 `supply-chain.dependency-confusion` 元数据。
- 已建立漏洞版 / 修复版说明目录。
- 已建立攻击方观察、修复说明和手动验证文档。
- 已建立脚本目录说明，但不提供 `exploit.py` 或 `verify.ts`。
- 元数据当前只登记 docs 入口，不登记 web、api 或 scripts 入口。
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

这些样例只作为学习标签和风险说明使用，不连接真实包生态。

## 后续入口规划

后续 API 规划为：

```text
POST /api/labs/supply-chain/dependency-confusion/:variant/resolve
```

后续请求体只允许固定字段：

- `manifestKey`
- `registryScenarioKey`
- `resolutionPolicyKey`

实现前仍需再次按共享类型、元数据规范和服务设计确认字段名，不允许用猜测字段兜底。

## 安全边界

- 不运行真实依赖安装、登录、下载、打包或发布命令。
- 不访问真实 npm、pnpm、PyPI、Maven、私有 registry 或镜像源。
- 不发布真实包。
- 不创建真实投毒包、包归档、发布脚本或生命周期脚本。
- 不读取 `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token、registry 凭据、CI 凭据或真实依赖缓存。
- 不保存完整 manifest、真实包名清单、真实 registry 地址、token、Cookie、凭据、内部组织名或本机路径。
- 不提供 `exploit.py`。

## 后续切片

1. 后端固定解析服务和受控 `resolve` API。
2. 前端依赖解析观察工作台。
3. 服务端、前端和路由测试。
4. 只读一致性验证脚本。
5. 按 simulation ready 标准收口。
