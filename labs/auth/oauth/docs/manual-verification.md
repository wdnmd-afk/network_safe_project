<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# OAuth 漏洞手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `tampered-authorization-response` | `authorization-binding-missing` | `accepted` | `auth-oauth-risk-accepted` |
| 修复版高风险 | `tampered-authorization-response` | `authorization-binding-missing` | `blocked` | `auth-oauth-defense-blocked` |
| 修复版正常流程 | `tampered-authorization-response` | `pkce-state-verified` | `accepted` | `auth-oauth-normal-verified` |
| 未知案例 | `unknown-scenario` | `authorization-binding-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
