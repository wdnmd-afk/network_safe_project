<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 开放重定向防御复盘版

## 目标

观察验证落实“站内相对路径约束、规范化和目标允许列表”后的正常受控流程。

## 固定输入

- `scenarioKey`：`untrusted-return-target`
- 默认 `controlKey`：`target-allowlist-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`web-open-redirect-defense-blocked`
- 正常受控信号：`web-open-redirect-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
