<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 恶意浏览器插件手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-extension-permission-change` | `extension-review-missing` | `accepted` | `client-malicious-extension-risk-accepted` |
| 修复版高风险 | `synthetic-extension-permission-change` | `extension-review-missing` | `blocked` | `client-malicious-extension-defense-blocked` |
| 修复版正常流程 | `synthetic-extension-permission-change` | `managed-extension-verified` | `accepted` | `client-malicious-extension-normal-verified` |
| 未知案例 | `unknown-scenario` | `extension-review-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
