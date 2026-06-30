# SQL 注入修复版

修复版使用参数化查询，把用户输入作为值传给数据库，而不是把输入拼进 SQL 结构。

同样输入：

```text
%' OR 1=1 #
```

在修复版中只会被当作普通搜索文本，不会改变 `WHERE` 条件。

观察重点：

- 查询预览中使用 `?` 表示参数占位。
- 后端决策为 `blocked`。
- 学习信号为 `sql-injection-parameterized-blocked`。
- `lab_event_logs` 记录防御阶段和阻断原因摘要。
