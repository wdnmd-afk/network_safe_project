<!-- 由 tools/generate-guided-lab-assets.mjs 生成 -->
# 水坑攻击防御复盘版

## 目标

观察验证落实“脚本完整性、浏览器隔离、供应商变更监控和终端检测”后的正常受控流程。

## 固定输入

- `scenarioKey`：`synthetic-industry-portal-change`
- 默认 `controlKey`：`trusted-site-bypassed-review`

## 预期结果

- 默认高风险策略决策：`blocked`
- 阻断信号：`social-watering-hole-defense-blocked`
- 正常受控信号：`social-watering-hole-normal-verified`

## 关键约束

页面和 API 不接受真实目标、自由正文、凭据、Cookie、token、外部 URL 或系统命令。
