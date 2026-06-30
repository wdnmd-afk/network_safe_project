# SQL 注入修复说明

## 漏洞根因

漏洞版把用户输入直接拼接进 SQL 字符串。攻击者输入中的 `'`、`OR 1=1`、`--` 会被数据库解释为 SQL 语法，而不是普通搜索文本。

## 修复策略

修复版使用参数化查询：

```sql
WHERE is_deleted = 0
  AND is_hidden = 0
  AND name LIKE ?
```

用户输入只作为参数值绑定，不参与 SQL 结构拼接。

## 防御效果

同样 payload：

```text
%' OR 1=1 #
```

在修复版中不会改变 `WHERE` 条件，因此隐藏商品不会被返回。

## 日志差异

漏洞版：

- `phase = attack`
- `decision = accepted`
- `signal = sql-injection-data-exposed`
- `risk_level = critical`

修复版：

- `phase = defense`
- `decision = blocked`
- `signal = sql-injection-parameterized-blocked`
- `risk_level = high`

## 生产环境还需要

- 数据库账号最小权限。
- 统一 ORM / query builder 约束。
- 错误信息收敛，避免泄露 SQL 结构。
- 输入长度和字符边界限制。
- 审计日志与告警。
- 敏感数据分级与访问控制。
