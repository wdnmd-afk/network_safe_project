<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# Deepfake防御复盘版

## 目标

观察验证落实“可信通道回拨、多因素业务确认、媒体来源证明和人工复核”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-executive-media-claim`
- 默认 `controlKey`：`media-appearance-trusted`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`ai-deepfake-defense-blocked`
- 正常受控信号：`ai-deepfake-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
