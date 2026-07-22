<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 驾车式下载风险观察版

## 目标

观察浏览器和终端允许不可信内容触发下载或执行链如何使固定高风险动作被接受。

## 固定输入

- `scenarioKey`：`synthetic-silent-download-chain`
- 默认 `controlKey`：`download-policy-missing`

## 预期结果

- 决策：`accepted`
- 学习信号：`client-drive-by-download-risk-accepted`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
