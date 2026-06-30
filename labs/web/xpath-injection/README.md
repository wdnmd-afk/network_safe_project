# XPath 注入

## 实验目标

本实验计划通过“XML 产品目录查询预览”业务展示 XPath 注入风险：

1. 攻击者如何从 XML 查询条件中寻找可控输入。
2. 漏洞版为什么会在虚拟查询中出现结果范围扩大的学习信号。
3. 修复版为什么需要服务端固定查询模板、字段允许列表和文本值处理。
4. 统一事件日志如何记录风险摘要，而不是保存完整危险输入或完整 XPath 表达式。

## 当前状态

当前实验处于 `ready` 状态：

- 已建立实验目录、元数据和文档骨架。
- 已锁定业务包装、接口计划和安全边界。
- 已实现后端虚拟 XML 产品目录查询 service 和受控 API。
- 已接入 `lab_event_logs` 统一事件日志。
- 已实现漏洞版 / 修复版前端页面。
- 已补充本机受控 `exploit.py` 与 `verify.ts`。
- 已补充前端、后端和共享元数据测试入口。

## 后续接口计划

```text
POST /api/labs/web/xpath-injection/:variant/search
```

计划请求字段：

- `queryTemplate`：固定查询模板，初期只允许 `product-catalog-by-name`。
- `keyword`：普通业务关键词文本。
- `scope`：固定查询范围，初期只允许 `public-catalog`。

## 当前后端入口

- 漏洞版接口：`POST /api/labs/web/xpath-injection/vuln/search`
- 修复版接口：`POST /api/labs/web/xpath-injection/fixed/search`
- 漏洞版页面：`/labs/web/xpath-injection/vuln`
- 修复版页面：`/labs/web/xpath-injection/fixed`
- 本机脚本目录：`tools/lab-scripts/web/xpath-injection/`

## 安全边界

- 不读取真实 XML 文件。
- 不执行任意 XPath 表达式。
- 不接入外部 XML 数据源。
- 不访问外部目标。
- 不读取真实本机文件。
- 不保存完整危险输入、完整查询表达式、真实 token、真实 Cookie 或外部目标信息。
- 不提供通用 payload 库。

## 计划信号

- `xpath-injection-safe-query-completed`：正常虚拟查询完成。
- `xpath-injection-controlled-sample-detected`：漏洞版识别到固定受控学习样例。
- `xpath-injection-result-scope-expanded`：漏洞版虚拟结果范围被扩大。
- `xpath-injection-controlled-sample-blocked`：修复版阻断受控样例。
- `xpath-injection-template-not-found`：模板允许列表阻断未知查询模板。

## 相关文档

- [攻击步骤](docs/attack-steps.md)
- [修复说明](docs/fix-notes.md)
- [手动验证](docs/manual-verification.md)
- [实现执行文档](../../../docs/execution/2026-06-30-web-xpath-injection-lab.md)
