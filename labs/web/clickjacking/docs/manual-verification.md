# 点击劫持手工验证

本实验已在 LT-006 专用化为两步决策交互（框架策略 → 敏感动作确认），评估请求只接受固定 `scenarioKey` 和有序 `decisions` 决策路径。

| 变体 | scenarioKey | decisions（有序 optionKey） | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `embedded-approval-overlay` | `allow-any-origin-framing` → `execute-without-confirmation` | `accepted` | `web-clickjacking-risk-accepted` |
| 修复版拦截 | `embedded-approval-overlay` | `enforce-frame-ancestors` → `defense-intercepts-clickjacked-action` | `blocked` | `web-clickjacking-defense-blocked` |
| 修复版正常流程 | `embedded-approval-overlay` | `enforce-frame-ancestors` → `require-explicit-confirmation` | `accepted` | `web-clickjacking-normal-verified` |
| 未知决策 | `embedded-approval-overlay` | `unknown-option` | `blocked` | `web-clickjacking-boundary-blocked` |
| 未知案例 | `unknown-scenario` | 任意 | `blocked` | `web-clickjacking-boundary-blocked` |

验证路径：

1. 访问 `/labs/web/clickjacking/vuln`，按“运行风险路径”走完两步，观察 `web-clickjacking-risk-accepted`。
2. 访问 `/labs/web/clickjacking/fixed`，走防御拦截路径，观察 `web-clickjacking-defense-blocked`。
3. 在修复版选择“要求明确确认”，走正常流程，观察 `web-clickjacking-normal-verified`。

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
