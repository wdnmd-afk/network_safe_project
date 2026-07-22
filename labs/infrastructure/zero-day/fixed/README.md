<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 零日漏洞利用防御复盘版

## 目标

观察验证落实“攻击面收敛、虚拟补丁、行为检测、隔离、威胁狩猎和应急响应”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-unknown-exploit-signal`
- 默认 `controlKey`：`compensating-control-missing`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`infrastructure-zero-day-defense-blocked`
- 正常受控信号：`infrastructure-zero-day-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
