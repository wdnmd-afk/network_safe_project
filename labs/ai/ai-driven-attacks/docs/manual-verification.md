<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# AI 驱动攻击手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-automated-attack-chain` | `agent-guardrail-missing` | `accepted` | `ai-ai-driven-attacks-risk-accepted` |
| 修复版高风险 | `synthetic-automated-attack-chain` | `agent-guardrail-missing` | `blocked` | `ai-ai-driven-attacks-defense-blocked` |
| 修复版正常流程 | `synthetic-automated-attack-chain` | `human-tool-policy-verified` | `accepted` | `ai-ai-driven-attacks-normal-verified` |
| 未知案例 | `unknown-scenario` | `agent-guardrail-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
