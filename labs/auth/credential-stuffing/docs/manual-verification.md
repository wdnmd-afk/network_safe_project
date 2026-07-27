# 凭据填充手工验证

本实验已在 LT-008 专用化为两步决策交互（风险关联策略 → 挑战决策），评估请求只接受固定 `scenarioKey` 和有序 `decisions` 决策路径。

| 路径 | scenarioKey | decisions（有序 optionKey） | 预期决策 | 预期终止信号 |
|---|---|---|---|---|
| 风险路径 | `reused-credential-batch` | `trust-single-password-result` → `accept-without-challenge` | `accepted` | `auth-credential-stuffing-risk-accepted` |
| 防御拦截路径 | `reused-credential-batch` | `enable-cross-request-correlation` → `defense-blocks-risky-batch` | `blocked` | `auth-credential-stuffing-defense-blocked` |
| 正常登录路径 | `reused-credential-batch` | `enable-cross-request-correlation` → `allow-verified-legitimate-login` | `accepted` | `auth-credential-stuffing-normal-verified` |
| 未知案例 | `unknown-scenario` | 任意 | `blocked` | `auth-credential-stuffing-boundary-blocked` |
| 未登记决策 | `reused-credential-batch` | 含未登记 optionKey | `blocked` | `auth-credential-stuffing-boundary-blocked` |

验证过程中不得输入或保存真实账号、口令、Cookie、token、外部 URL、付款数据或真实业务材料。页面只提供固定决策选项，不接受自由输入。
