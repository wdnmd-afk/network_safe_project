<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 对抗性 AI手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-model-evasion-sample` | `model-output-trusted` | `accepted` | `ai-adversarial-ai-risk-accepted` |
| 修复版高风险 | `synthetic-model-evasion-sample` | `model-output-trusted` | `blocked` | `ai-adversarial-ai-defense-blocked` |
| 修复版正常流程 | `synthetic-model-evasion-sample` | `robustness-review-verified` | `accepted` | `ai-adversarial-ai-normal-verified` |
| 未知案例 | `unknown-scenario` | `model-output-trusted` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
