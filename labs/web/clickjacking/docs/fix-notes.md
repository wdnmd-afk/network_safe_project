# 点击劫持修复说明

## 根因

页面允许被任意来源嵌入且敏感动作缺少二次确认。

## 修复策略

- 第一步启用 CSP frame-ancestors 与 X-Frame-Options，使页面不再被任意来源嵌入（`enforce-frame-ancestors`）。
- 第二步对敏感审批动作要求处置：防御拦截被劫持动作（`defense-intercepts-clickjacked-action`），或在明确用户确认后放行正常流程（`require-explicit-confirmation`）。
- 未知 `scenarioKey` 或决策 `optionKey` 必须脱敏阻断且不回显原始值。
- 事件日志只记录固定案例 key、决策路径信号、后端决策和结果计数。
- 正常受控流程必须通过“要求明确的用户确认”验证，不得一刀切破坏正常业务。

## 生产补充

真实生产环境还需要结合资产、身份、网络、终端、供应商和应急响应体系实施分层防护；本实验结果不能替代生产安全评估。
