<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 驾车式下载防御复盘版

## 目标

观察验证落实“浏览器更新、下载确认、内容隔离、应用控制和终端检测”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-silent-download-chain`
- 默认 `controlKey`：`download-policy-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`client-drive-by-download-defense-blocked`
- 正常受控信号：`client-drive-by-download-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
