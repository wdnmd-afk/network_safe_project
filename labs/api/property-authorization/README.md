# API 属性级授权与批量绑定

## 实验目标

使用固定资料更新 DTO 对比全量字段绑定与“字段允许列表 + 服务端所有权”策略，理解属性级授权和批量绑定风险。页面只接受固定决策，不提供 JSON 编辑器或真实用户字段。

## 前置条件

- 本机后端运行于 `http://127.0.0.1:6667`，前端运行于项目配置的本机地址。
- 已使用项目演示账号登录，以便提交固定评估并记录安全摘要。
- 只使用工作台返回的 `scenarioKey` 和 `optionKey`。

## 使用方式

1. 从实验详情进入风险观察版，载入推荐路径并运行固定评估。
2. 切换到防御复盘版，运行字段允许列表和服务端所有权阻断路径。
3. 在防御复盘版载入正常字段更新路径，确认 `displayName` 仍可更新。
4. 对照以下三个 canonical 信号和实验事件日志中的固定安全摘要。

- 风险路径：`bind-all-client-fields` → `persist-server-owned-fields`。
- 防御路径：`enforce-field-allowlist-and-server-ownership` → `block-server-owned-field-update`。
- 正常路径：同一防御策略 → `allow-display-name-update`。

## 安全边界

只在本机受控环境使用；不会修改真实账户、角色、状态或额度，也不会接收真实 DTO、用户 ID 或自由 JSON。
