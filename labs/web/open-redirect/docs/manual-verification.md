# 开放重定向手工验证

本实验已在 LT-007 专用化为两步决策交互（跳转目标来源 → 重定向决策），评估请求只接受固定 `scenarioKey` 和有序 `decisions` 决策路径。

| 路径 | scenarioKey | decisions（有序 optionKey） | 预期决策 | 预期终止信号 |
|---|---|---|---|---|
| 风险路径 | `untrusted-return-target` | `trust-user-supplied-target` → `redirect-without-validation` | `accepted` | `web-open-redirect-risk-accepted` |
| 防御拦截路径 | `untrusted-return-target` | `enforce-target-allowlist` → `defense-blocks-untrusted-redirect` | `blocked` | `web-open-redirect-defense-blocked` |
| 正常跳转路径 | `untrusted-return-target` | `enforce-target-allowlist` → `redirect-to-verified-relative-path` | `accepted` | `web-open-redirect-normal-verified` |
| 未知案例 | `unknown-scenario` | 任意 | `blocked` | `web-open-redirect-boundary-blocked` |
| 未知决策 | `untrusted-return-target` | 任一未登记 optionKey | `blocked` | `web-open-redirect-boundary-blocked` |
| 不完整路径 | `untrusted-return-target` | 只提交第一步 | `blocked` | `blockedReason=path-incomplete` |

验证步骤：

1. 登录本机学习平台。
2. 打开 `/labs/web/open-redirect/vuln`，按“载入推荐路径”走风险路径，运行固定评估，观察 `web-open-redirect-risk-accepted`。
3. 打开 `/labs/web/open-redirect/fixed`，走防御拦截路径，观察 `web-open-redirect-defense-blocked`。
4. 在修复版按“正常确认流程”走正常跳转路径，观察 `web-open-redirect-normal-verified`。
5. 在统一事件日志中确认只记录固定 key、决策路径信号和结果计数。

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
