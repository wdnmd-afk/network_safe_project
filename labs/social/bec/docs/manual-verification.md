<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 商业邮件诈骗手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-vendor-bank-change` | `email-thread-trusted` | `accepted` | `social-bec-risk-accepted` |
| 修复版高风险 | `synthetic-vendor-bank-change` | `email-thread-trusted` | `blocked` | `social-bec-defense-blocked` |
| 修复版正常流程 | `synthetic-vendor-bank-change` | `vendor-master-verified` | `accepted` | `social-bec-normal-verified` |
| 未知案例 | `unknown-scenario` | `email-thread-trusted` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
