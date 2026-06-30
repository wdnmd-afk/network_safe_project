# SQL 注入手动验证

## 验证矩阵

| 场景 | 输入 | 预期结果 |
|---|---|---|
| 漏洞版正常搜索 | `router` | 返回公开商品，信号为 `sql-injection-normal-search` |
| 漏洞版攻击样例 | `%' OR 1=1 #` | 返回隐藏商品，信号为 `sql-injection-data-exposed` |
| 修复版正常搜索 | `router` | 返回公开商品，信号为 `sql-injection-normal-search` |
| 修复版攻击样例 | `%' OR 1=1 #` | 请求被阻断，信号为 `sql-injection-parameterized-blocked` |
| 安全边界 | `'; DROP TABLE users; --` | 请求被阻断，信号为 `sql-injection-safety-boundary-blocked` |

## 后端日志检查

控制台应出现类似日志：

```text
[LAB_EVENT] trace=... lab=web.sql-injection variant=vuln phase=attack decision=accepted signal=sql-injection-data-exposed message="漏洞版拼接 SQL 后接受了攻击语义，隐藏数据被返回。"
```

## 数据库日志检查

可在本机数据库中查看：

```sql
SELECT lab_key, variant_key, phase, decision, signal, risk_level, created_at
FROM lab_event_logs
WHERE lab_key = 'web.sql-injection'
ORDER BY created_at DESC;
```

日志中不应保存完整任意 payload，只应保存输入摘要、结果数量和学习信号。
