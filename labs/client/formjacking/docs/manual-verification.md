# Formjacking 手工验证

本实验已在 LT-016 专用化为两步决策模拟（第三方脚本信任策略 → 表单提交目标决策），评估请求只接受固定 `scenarioKey` 和有序 `decisions` 决策路径。

## 固定决策路径与预期信号

| 路径 | decisions（有序 optionKey） | 变体 | 预期决策 | 预期终止信号 |
|---|---|---|---|---|
| 风险路径 | `trust-unrestricted-scripts` → `submit-to-tampered-target` | vuln | `accepted` | `client-formjacking-risk-accepted` |
| 防御拦截路径 | `enforce-csp-sri-allowlist` → `defense-blocks-tampered-target` | fixed | `blocked` | `client-formjacking-defense-blocked` |
| 正常提交路径 | `enforce-csp-sri-allowlist` → `submit-to-verified-first-party-target` | fixed | `accepted` | `client-formjacking-normal-verified` |
| 未登记决策 | 任意未登记 optionKey | 任意 | `blocked` | `client-formjacking-boundary-blocked` |

## 验证步骤

1. 登录本机学习平台。
2. 打开 `/labs/client/formjacking/vuln`，载入推荐路径后运行固定评估，确认风险路径终止信号。
3. 打开 `/labs/client/formjacking/fixed`，运行推荐（防御拦截）路径，确认高风险提交被阻断。
4. 在修复版选择“正常提交流程”，确认第一方目标校验通过后正常结账可以继续。
5. 在统一事件日志中确认只记录固定 key、决策路径信号和结果计数。

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
