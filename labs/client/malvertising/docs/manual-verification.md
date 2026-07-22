<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 恶意广告手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-ad-chain-change` | `ad-supply-trusted` | `accepted` | `client-malvertising-risk-accepted` |
| 修复版高风险 | `synthetic-ad-chain-change` | `ad-supply-trusted` | `blocked` | `client-malvertising-defense-blocked` |
| 修复版正常流程 | `synthetic-ad-chain-change` | `content-sandbox-verified` | `accepted` | `client-malvertising-normal-verified` |
| 未知案例 | `unknown-scenario` | `ad-supply-trusted` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
