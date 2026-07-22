<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 水坑攻击手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-industry-portal-change` | `trusted-site-bypassed-review` | `accepted` | `social-watering-hole-risk-accepted` |
| 修复版高风险 | `synthetic-industry-portal-change` | `trusted-site-bypassed-review` | `blocked` | `social-watering-hole-defense-blocked` |
| 修复版正常流程 | `synthetic-industry-portal-change` | `script-integrity-verified` | `accepted` | `social-watering-hole-normal-verified` |
| 未知案例 | `unknown-scenario` | `trusted-site-bypassed-review` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
