# LT-036 API 属性级授权与批量绑定实验执行文档

## 1. 目标

新增 `api.property-authorization` 专用 D4 实验，用固定 DTO 字段快照对比“绑定全部客户端字段”与“字段允许列表 + 服务端所有权”的差异。

## 2. 固定字段与状态机

固定 DTO 字段：

- `displayName`：`user-editable`，允许用户修改。
- `role`：`server-owned`，客户端请求为 `admin`，服务端固定值为 `member`。
- `status`：`server-owned`，客户端请求为 `active`，服务端固定值为 `active`。
- `accountLimit`：`server-owned`，客户端请求为 `9999`，服务端固定值为 `100`。

请求只接受 `scenarioKey: fixed-profile-update-dto` 和有序 `decisions`，不接受真实 DTO、用户 ID、角色或自由文本。

两步决策：

1. `bind-all-client-fields` / `enforce-field-allowlist-and-server-ownership`。
2. `persist-server-owned-fields` / `block-server-owned-field-update` / `allow-display-name-update`。

## 3. 范围与步骤

- 专用服务/API、前端工作台、路由、事件摘要、元数据、标准文档、测试和 `verify.ts`。
- 不修改真实用户、数据库角色或账号状态。
- 未知 key 脱敏阻断，正常路径证明 `displayName` 仍可更新。

## 4. 风险、优化与验证

- 页面展示结构化字段对照，不提供任意 JSON 编辑器。
- 验证专项脚本、服务/API/前端测试、entrypoints、coverage、`pnpm verify`。

## 5. 完成条件

- 漏洞、防御、正常三条 canonical 信号稳定；75/150 新基线中的本实验状态与所有入口一致。

