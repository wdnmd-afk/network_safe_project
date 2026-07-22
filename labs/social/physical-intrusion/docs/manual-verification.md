<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 尾随 / 物理入侵手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-tailgating-event` | `courtesy-overrides-policy` | `accepted` | `social-physical-intrusion-risk-accepted` |
| 修复版高风险 | `synthetic-tailgating-event` | `courtesy-overrides-policy` | `blocked` | `social-physical-intrusion-defense-blocked` |
| 修复版正常流程 | `synthetic-tailgating-event` | `visitor-process-verified` | `accepted` | `social-physical-intrusion-normal-verified` |
| 未知案例 | `unknown-scenario` | `courtesy-overrides-policy` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
