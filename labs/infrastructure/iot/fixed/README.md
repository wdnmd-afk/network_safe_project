<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# IoT 攻击防御复盘版

## 目标

观察验证落实“唯一身份、签名固件、网络分区、资产清单和管理面限制”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-iot-device-exposure`
- 默认 `controlKey`：`device-governance-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`infrastructure-iot-defense-blocked`
- 正常受控信号：`infrastructure-iot-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
