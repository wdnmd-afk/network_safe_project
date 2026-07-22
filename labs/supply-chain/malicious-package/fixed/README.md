<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 恶意包注入防御复盘版

## 目标

观察验证落实“来源证明、锁文件、脚本禁用策略、依赖审查和隔离构建”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-package-change`
- 默认 `controlKey`：`package-review-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`supply-chain-malicious-package-defense-blocked`
- 正常受控信号：`supply-chain-malicious-package-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
