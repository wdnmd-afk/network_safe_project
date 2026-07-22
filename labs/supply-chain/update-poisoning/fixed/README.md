<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 更新投毒防御复盘版

## 目标

观察验证落实“离线签名、透明发布、通道固定、回滚保护和分阶段部署”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-update-manifest-change`
- 默认 `controlKey`：`update-trust-unverified`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`supply-chain-update-poisoning-defense-blocked`
- 正常受控信号：`supply-chain-update-poisoning-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
