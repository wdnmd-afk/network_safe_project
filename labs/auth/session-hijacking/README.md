# 会话劫持

## 场景目标

通过固定脱敏会话摘要的两步决策，对比会话标识长期有效未绑定上下文与启用上下文绑定、会话轮换和高风险动作再认证的差异。

本实验已在 LT-009 专用化为两步决策交互（上下文绑定策略 → 会话处置决策），只使用固定案例 `replayed-session-summary`，用于对比漏洞版与修复版的后端判定、学习信号和统一事件日志。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要外部目标、第三方服务、真实凭据或真实业务数据。

## 使用方式

1. 访问 `/labs/auth/session-hijacking/vuln`，沿风险路径（信任长期有效会话 → 直接接受被复用会话）观察 `auth-session-hijacking-risk-accepted`。
2. 切换到 `/labs/auth/session-hijacking/fixed`，沿防御路径（绑定设备上下文 → 阻断被复用会话）观察 `auth-session-hijacking-defense-blocked`。
3. 在修复版选择正常流程路径（绑定上下文 → 再认证通过后放行），确认 `auth-session-hijacking-normal-verified` 正常受控流程仍可继续。
4. 在实验详情或账户中心复盘统一事件日志。

## 安全边界

- 只处理固定虚构身份与会话数据，不读取真实账号、密码、Cookie 或 token。
- 页面和 API 只接受本实验声明的固定 scenarioKey 与决策 optionKey。
- 未知 key 会被脱敏阻断，不写入原始输入或外部目标信息。

该实验仅提供本机受控固定场景和只读验证，不允许扩展为通用攻击工具。
