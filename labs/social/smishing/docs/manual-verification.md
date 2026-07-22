<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 短信钓鱼手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-delivery-alert` | `message-context-trusted` | `accepted` | `social-smishing-risk-accepted` |
| 修复版高风险 | `synthetic-delivery-alert` | `message-context-trusted` | `blocked` | `social-smishing-defense-blocked` |
| 修复版正常流程 | `synthetic-delivery-alert` | `official-channel-verified` | `accepted` | `social-smishing-normal-verified` |
| 未知案例 | `unknown-scenario` | `message-context-trusted` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
