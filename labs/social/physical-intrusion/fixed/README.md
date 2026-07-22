<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 尾随 / 物理入侵防御复盘版

## 目标

观察验证落实“逐人门禁、访客陪同、分区控制和无责举报流程”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-tailgating-event`
- 默认 `controlKey`：`courtesy-overrides-policy`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`social-physical-intrusion-defense-blocked`
- 正常受控信号：`social-physical-intrusion-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
