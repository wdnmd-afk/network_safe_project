<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 恶意浏览器插件防御复盘版

## 目标

观察验证落实“企业允许列表、最小权限、更新审计和敏感站点隔离”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-extension-permission-change`
- 默认 `controlKey`：`extension-review-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`client-malicious-extension-defense-blocked`
- 正常受控信号：`client-malicious-extension-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
