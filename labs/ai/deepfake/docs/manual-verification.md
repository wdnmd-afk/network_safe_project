<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# Deepfake手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-executive-media-claim` | `media-appearance-trusted` | `accepted` | `ai-deepfake-risk-accepted` |
| 修复版高风险 | `synthetic-executive-media-claim` | `media-appearance-trusted` | `blocked` | `ai-deepfake-defense-blocked` |
| 修复版正常流程 | `synthetic-executive-media-claim` | `trusted-channel-confirmed` | `accepted` | `ai-deepfake-normal-verified` |
| 未知案例 | `unknown-scenario` | `media-appearance-trusted` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
