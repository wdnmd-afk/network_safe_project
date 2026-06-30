# SQL 注入

## 实验目标

本实验通过“商品安全库存搜索”业务展示 SQL 注入的核心风险：

1. 攻击者如何把普通搜索关键词变成 SQL 条件片段。
2. 漏洞版为什么会返回隐藏商品。
3. 修复版为什么能用参数化查询阻断同样输入。
4. 后端控制台日志和 `lab_event_logs` 如何记录本次攻防判断。

## 安全边界

- 只面向本机平台和本项目数据库中的 `sql_injection_lab_products` 场景表。
- 只演示受控读取差异，不提供破坏、写入、延时、文件读写、联合查询等能力。
- 脚本默认只允许访问 `localhost` / `127.0.0.1`。
- 日志只保存输入摘要和学习信号，不保存完整任意 payload。

## 使用方式

1. 登录平台演示账号。
2. 进入 `/labs/web/sql-injection/vuln`。
3. 点击“填入正常关键词”并提交，观察只返回公开商品。
4. 点击“填入攻击样例”并提交，观察漏洞版返回隐藏商品和 `sql-injection-data-exposed` 信号。
5. 切换到 `/labs/web/sql-injection/fixed`。
6. 使用同样攻击样例提交，观察 `sql-injection-parameterized-blocked` 信号。

## 关键入口

- 漏洞版页面：`/labs/web/sql-injection/vuln`
- 修复版页面：`/labs/web/sql-injection/fixed`
- 漏洞版接口：`POST /api/labs/web/sql-injection/vuln/search`
- 修复版接口：`POST /api/labs/web/sql-injection/fixed/search`
- 本机攻击样例脚本：`tools/lab-scripts/web/sql-injection/exploit.py`
- 验证脚本：`tools/lab-scripts/web/sql-injection/verify.ts`

## 预期信号

- `sql-injection-normal-search`：正常搜索，只返回公开商品。
- `sql-injection-data-exposed`：漏洞版接受注入语义，隐藏商品被返回。
- `sql-injection-parameterized-blocked`：修复版使用参数化查询阻断注入语义。
- `sql-injection-safety-boundary-blocked`：输入超出本机受控实验边界。

## 相关文档

- `docs/attack-steps.md`
- `docs/fix-notes.md`
- `docs/manual-verification.md`
