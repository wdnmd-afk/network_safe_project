# API 属性级授权与批量绑定

使用固定资料更新 DTO 对比全量字段绑定与字段允许列表。页面只接受固定决策，不提供 JSON 编辑器或真实用户字段。

- 风险路径：`bind-all-client-fields` → `persist-server-owned-fields`。
- 防御路径：`enforce-field-allowlist-and-server-ownership` → `block-server-owned-field-update`。
- 正常路径：同一防御策略 → `allow-display-name-update`。

只在本机受控环境使用；不会修改真实账户、角色、状态或额度。
