# 解析风险观察版

## 目标

本变体用于观察依赖混淆中的错误解析倾向：当私有依赖未使用 scope、未固定私有 registry、缺少 lockfile 或缺少来源审计时，解析链路可能偏向不可信来源。

当前为 `ready`：前端已提供固定选择器工作台，后端已提供受控 `resolve` API，Playwright 已覆盖漏洞版固定公共来源选择页面信号，并已提供本机只读一致性验证脚本；ready 只代表本项目内固定样例学习闭环完成，仍不存在攻击脚本或真实包生态连接能力。

## 当前观察方式

前端入口：

```text
/labs/supply-chain/dependency-confusion/vuln
```

漏洞版 API 只允许使用固定样例 key：

- 固定 `manifestKey`
- 固定 `registryScenarioKey`
- 固定 `resolutionPolicyKey`

当前 API 可展示：

- 固定 manifest 摘要。
- 固定伪 registry 元数据。
- 错误来源选择的学习信号。
- 为什么缺少 scope、来源绑定或 lockfile 会扩大风险。

当前可观察信号：

- `dependency-confusion-public-source-selected`
- `dependency-confusion-private-scope-missing`

页面级验证已确认漏洞版“未绑定 scope”固定样例会展示错误公共来源选择、`accepted` 决策、`public-registry` 来源、`untrusted` 信任状态、`missing` scope 状态和 `missing` lockfile 状态。

当前入口：

```text
POST /api/labs/supply-chain/dependency-confusion/vuln/resolve
```

前端页面只会向该接口提交 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`，不提交真实包名、registry 地址、`.npmrc`、token、lockfile、安装命令或发布命令。

## 禁止能力

- 不运行真实安装命令。
- 不访问真实 registry。
- 不发布真实包。
- 不生成生命周期脚本、包归档或投毒模板。
- 不读取真实 `.npmrc`、token、CI 凭据或本机依赖缓存。
- 不提供 `exploit.py`。
