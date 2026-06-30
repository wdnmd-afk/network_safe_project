# NoSQL 注入脚本目录

## 当前状态

本目录提供 `web/nosql-injection` 的本机受控脚本入口：

- `exploit.py`：调用本项目本机 NoSQL 注入实验 API，提交固定正常样例或固定受控样例。
- `verify.ts`：输出漏洞版 / 修复版差异验证计划，不直接发起网络请求。

## 使用方式

默认目标为 `http://127.0.0.1:6667`，需要先通过本机平台登录获得演示账号 token。

```powershell
python tools/lab-scripts/web/nosql-injection/exploit.py --token <local-token> --variant vuln --sample controlled
python tools/lab-scripts/web/nosql-injection/exploit.py --token <local-token> --variant fixed --sample controlled
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/nosql-injection/verify.ts
```

## 安全边界

- 默认只访问 `http://127.0.0.1:6667`。
- 只允许 `localhost` / `127.0.0.1` / `::1`。
- 不访问外部目标。
- 不连接真实 MongoDB、Redis、Elasticsearch 或其他 NoSQL 服务。
- 不生成通用 payload 库。
- 不保存真实 token、Cookie、密码或完整查询结构。

## 预期信号

- `nosql-injection-safe-query-completed`
- `nosql-injection-query-expanded`
- `nosql-injection-operator-blocked`
