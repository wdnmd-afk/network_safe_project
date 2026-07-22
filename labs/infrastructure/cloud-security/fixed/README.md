<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 云安全漏洞防御复盘版

## 目标

观察验证落实“最小权限、组织策略、配置扫描、短期凭据和持续审计”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-cloud-policy-exposure`
- 默认 `controlKey`：`cloud-policy-review-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`infrastructure-cloud-security-defense-blocked`
- 正常受控信号：`infrastructure-cloud-security-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
