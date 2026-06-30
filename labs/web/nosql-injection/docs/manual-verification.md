# NoSQL 注入手动验证

## 验证前置

- 本机后端服务已启动。
- 本机前端页面可访问。
- 已登录演示账号。
- `web/nosql-injection` 元数据状态为 `ready`。

## 漏洞版正常查询

1. 打开 `/labs/web/nosql-injection/vuln`。
2. 点击“填入正常查询”。
3. 点击“查询优惠券”。
4. 预期信号为 `nosql-injection-safe-query-completed`。
5. 查询结果只包含公开虚拟优惠券。

## 漏洞版受控样例

1. 打开 `/labs/web/nosql-injection/vuln`。
2. 点击“填入受控样例”。
3. 点击“查询优惠券”。
4. 预期信号为 `nosql-injection-query-expanded`。
5. 页面显示虚拟查询范围扩大，并出现隐藏教学记录。

## 修复版阻断

1. 打开 `/labs/web/nosql-injection/fixed`。
2. 点击“填入受控样例”。
3. 点击“查询优惠券”。
4. 预期信号为 `nosql-injection-operator-blocked`。
5. 后端决策为 `blocked`，文档数量为 `0`。

## 日志检查

在账户中心或实验详情页查看最近事件复盘：

- 漏洞版受控样例阶段应为 `attack`。
- 修复版阻断阶段应为 `defense`。
- 日志只展示查询模式、输入长度、风险类别、结果范围和学习信号。
- 日志不展示完整关键词、完整筛选文本、完整查询结构或真实敏感数据。

## 脚本验证

```powershell
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/nosql-injection/verify.ts
python tools/lab-scripts/web/nosql-injection/exploit.py --token <local-token> --variant vuln --sample controlled
python tools/lab-scripts/web/nosql-injection/exploit.py --token <local-token> --variant fixed --sample controlled
```
