<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 恶意广告风险观察版

## 目标

观察站点将第三方广告内容置于过宽浏览器权限中如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-ad-chain-change`
- 默认 `controlKey`：`ad-supply-trusted`

## 预期结果

- 决策：`accepted`
- 学习信号：`client-malvertising-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
