<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 更新投毒手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-update-manifest-change` | `update-trust-unverified` | `accepted` | `supply-chain-update-poisoning-risk-accepted` |
| 修复版高风险 | `synthetic-update-manifest-change` | `update-trust-unverified` | `blocked` | `supply-chain-update-poisoning-defense-blocked` |
| 修复版正常流程 | `synthetic-update-manifest-change` | `signed-update-verified` | `accepted` | `supply-chain-update-poisoning-normal-verified` |
| 未知案例 | `unknown-scenario` | `update-trust-unverified` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
