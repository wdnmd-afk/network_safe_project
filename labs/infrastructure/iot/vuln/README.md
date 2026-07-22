<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# IoT 攻击风险观察版

## 目标

观察设备身份、固件更新和网络边界缺少统一治理如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-iot-device-exposure`
- 默认 `controlKey`：`device-governance-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`infrastructure-iot-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
