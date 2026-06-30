# NoSQL 注入

## 实验目标

本实验通过“优惠券文档检索”业务展示 NoSQL 注入风险：

1. 攻击者如何让输入影响结构化查询语义。
2. 漏洞版为什么可能扩大虚拟文档查询范围。
3. 修复版为什么只接受服务端定义的查询模板。
4. 统一事件日志如何记录风险类别和学习信号，而不是保存完整查询结构。

## 当前状态

当前实验已进入 `ready` 状态：

- 已实现漏洞版 / 修复版前端页面。
- 已实现后端虚拟文档查询器和受控 API。
- 已补充本机受控 `exploit.py` 与 `verify.ts`。
- 已补充前端、后端和共享元数据测试入口。
- 已接入 `lab_event_logs` 统一事件日志。

## 安全边界

- 不引入 MongoDB、Redis、Elasticsearch 或其他 NoSQL 服务。
- 不连接真实数据库或外部目标。
- 不执行任意对象查询。
- 不提供通用 NoSQL payload 库。
- 不保存完整危险输入、完整查询结构、真实密码、真实 token、真实 Cookie 或外部目标信息。

## 入口

- 漏洞版页面：`/labs/web/nosql-injection/vuln`
- 修复版页面：`/labs/web/nosql-injection/fixed`
- 漏洞版接口：`POST /api/labs/web/nosql-injection/vuln/search`
- 修复版接口：`POST /api/labs/web/nosql-injection/fixed/search`
- 本机脚本目录：`tools/lab-scripts/web/nosql-injection/`

## 预期信号

- `nosql-injection-safe-query-completed`：正常关键词查询完成。
- `nosql-injection-operator-detected`：漏洞版识别到受控风险样例。
- `nosql-injection-query-expanded`：漏洞版虚拟查询范围被扩大。
- `nosql-injection-operator-blocked`：修复版阻断操作符型风险。
- `nosql-injection-schema-blocked`：修复版阻断不符合模板的输入结构。

## 相关文档

- [攻击步骤](docs/attack-steps.md)
- [修复说明](docs/fix-notes.md)
- [手动验证](docs/manual-verification.md)
- [实现执行文档](../../../docs/execution/2026-06-30-web-nosql-injection-lab.md)
