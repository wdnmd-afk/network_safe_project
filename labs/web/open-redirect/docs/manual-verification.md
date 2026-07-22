<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 开放重定向手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `untrusted-return-target` | `target-allowlist-missing` | `accepted` | `web-open-redirect-risk-accepted` |
| 修复版高风险 | `untrusted-return-target` | `target-allowlist-missing` | `blocked` | `web-open-redirect-defense-blocked` |
| 修复版正常流程 | `untrusted-return-target` | `relative-path-verified` | `accepted` | `web-open-redirect-normal-verified` |
| 未知案例 | `unknown-scenario` | `target-allowlist-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
