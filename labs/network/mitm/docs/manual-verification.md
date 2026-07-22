<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 中间人攻击手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-handshake-interception` | `peer-verification-disabled` | `accepted` | `network-mitm-risk-accepted` |
| 修复版高风险 | `synthetic-handshake-interception` | `peer-verification-disabled` | `blocked` | `network-mitm-defense-blocked` |
| 修复版正常流程 | `synthetic-handshake-interception` | `certificate-identity-verified` | `accepted` | `network-mitm-normal-verified` |
| 未知案例 | `unknown-scenario` | `peer-verification-disabled` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
