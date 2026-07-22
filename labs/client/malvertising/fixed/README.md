<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 恶意广告防御复盘版

## 目标

观察验证落实“内容沙箱、供应商审核、CSP、重定向监控和浏览器隔离”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-ad-chain-change`
- 默认 `controlKey`：`ad-supply-trusted`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`client-malvertising-defense-blocked`
- 正常受控信号：`client-malvertising-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
