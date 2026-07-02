# 解析风险观察版

## 目标

本变体用于观察依赖混淆中的错误解析倾向：当私有依赖未使用 scope、未固定私有 registry、缺少 lockfile 或缺少来源审计时，解析链路可能偏向不可信来源。

当前为 `in-progress`：后端已提供受控 `resolve` API，仍不存在前端页面或脚本入口。

## 当前观察方式

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

当前入口：

```text
POST /api/labs/supply-chain/dependency-confusion/vuln/resolve
```

## 禁止能力

- 不运行真实安装命令。
- 不访问真实 registry。
- 不发布真实包。
- 不生成生命周期脚本、包归档或投毒模板。
- 不读取真实 `.npmrc`、token、CI 凭据或本机依赖缓存。
- 不提供 `exploit.py`。
