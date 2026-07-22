<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 驾车式下载手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-silent-download-chain` | `download-policy-missing` | `accepted` | `client-drive-by-download-risk-accepted` |
| 修复版高风险 | `synthetic-silent-download-chain` | `download-policy-missing` | `blocked` | `client-drive-by-download-defense-blocked` |
| 修复版正常流程 | `synthetic-silent-download-chain` | `browser-isolation-verified` | `accepted` | `client-drive-by-download-normal-verified` |
| 未知案例 | `unknown-scenario` | `download-policy-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
