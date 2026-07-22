<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 点击劫持手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `embedded-approval-overlay` | `frame-policy-missing` | `accepted` | `web-clickjacking-risk-accepted` |
| 修复版高风险 | `embedded-approval-overlay` | `frame-policy-missing` | `blocked` | `web-clickjacking-defense-blocked` |
| 修复版正常流程 | `embedded-approval-overlay` | `frame-policy-enforced` | `accepted` | `web-clickjacking-normal-verified` |
| 未知案例 | `unknown-scenario` | `frame-policy-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
