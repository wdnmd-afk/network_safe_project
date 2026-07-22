<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# IoT 攻击手工验证

| 变体 | scenarioKey | controlKey | 预期决策 | 预期信号 |
|---|---|---|---|---|
| 漏洞版 | `synthetic-iot-device-exposure` | `device-governance-missing` | `accepted` | `infrastructure-iot-risk-accepted` |
| 修复版高风险 | `synthetic-iot-device-exposure` | `device-governance-missing` | `blocked` | `infrastructure-iot-defense-blocked` |
| 修复版正常流程 | `synthetic-iot-device-exposure` | `segmented-device-policy-verified` | `accepted` | `infrastructure-iot-normal-verified` |
| 未知案例 | `unknown-scenario` | `device-governance-missing` | `blocked` | `guided-scenario-boundary-blocked` |

验证过程中不得输入或保存真实目标、凭据、Cookie、token、外部 URL、付款数据或真实业务材料。
