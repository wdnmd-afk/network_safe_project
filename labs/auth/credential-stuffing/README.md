# 凭据填充

## 场景目标

使用固定虚构登录批次观察重复凭据尝试与风险控制策略。

本实验已专用化为两步决策交互（风险关联策略 → 挑战决策），只使用固定案例 `reused-credential-batch`，用于对比“只判断单次口令 + 无挑战放行”与“建立跨请求风险关联 + 自适应挑战”的后端判定、学习信号和统一事件日志差异。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要外部目标、第三方服务、真实凭据或真实业务数据。

## 使用方式

1. 访问 `/labs/auth/credential-stuffing/vuln`，沿风险路径观察批量登录被接受（`auth-credential-stuffing-risk-accepted`）。
2. 切换到 `/labs/auth/credential-stuffing/fixed`，沿防御拦截路径观察高风险批次被阻断（`auth-credential-stuffing-defense-blocked`）。
3. 在修复版点击“正常登录流程”，确认自适应挑战通过后正常用户仍可登录（`auth-credential-stuffing-normal-verified`）。
4. 每步只提供固定决策按钮，不接受任意账号、口令或外部输入。
5. 在实验详情或账户中心复盘统一事件日志。

## 安全边界

- 只处理固定虚构身份与会话数据，不读取真实账号、密码、Cookie 或 token。
- 页面和 API 只接受本实验声明的固定 scenarioKey 与决策 optionKey。
- 未知 key 会被脱敏阻断，不写入原始输入或外部目标信息。

该实验仅提供本机受控固定场景和只读验证，不允许扩展为通用攻击工具。
