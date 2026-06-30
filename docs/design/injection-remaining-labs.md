# 注入类一期剩余清单规划

## 1. 文档定位

本文档用于规划注入类一期剩余实验的落地方式。

已完成并收口的注入类实验包括：

- `web.sql-injection`
- `web.command-injection`
- `web.ssti`
- `web.xxe`

剩余待规划实验包括：

- `web.nosql-injection`
- `web.ldap-injection`
- `web.xpath-injection`
- `web.crlf-injection`

## 2. 规划原则

剩余注入类实验继续遵守项目安全边界：

- 只面向本机、本项目、受控学习环境。
- 不连接外部真实目标。
- 不为了复现攻击引入难维护的本机服务。
- 不输出通用攻击工具或 payload 库。
- 不保存真实凭据、真实 token、真实 Cookie、完整 payload 或外部目标信息。
- 每个进入实现阶段的实验都必须同时提供漏洞版与修复版，或明确说明只能案例化的原因。

## 3. 推荐优先级

| 顺序 | 实验 | 推荐模式 | 当前结论 |
|---|---|---|---|
| 1 | `web/nosql-injection` | `interactive` | 适合作为下一项真实交互实验，但使用虚拟文档查询器，不引入 MongoDB |
| 2 | `web/crlf-injection` | `interactive` | 可做虚拟响应头构造预览，不做真实响应拆分或缓存投毒 |
| 3 | `web/xpath-injection` | `simulation` | 可做虚拟 XML 查询模拟，不执行任意 XPath 表达式 |
| 4 | `web/ldap-injection` | `case-study` | 已按 case-study ready 标准收口，具备前端虚拟目录工作台、Playwright 页面验证、只读一致性验证脚本和受控虚拟目录 API，仍不连接真实 LDAP 服务 |

## 4. NoSQL 注入规划

### 4.1 场景定位

建议业务包装为“文档检索 / 优惠券筛选 / 账号画像查询预览”。

学习目标：

- 理解结构化查询条件被用户输入改变后的风险。
- 理解客户端只应提交业务字段，而不应提交查询结构。
- 理解字段允许列表、操作符允许列表和服务端查询模板的防御价值。

### 4.2 漏洞版

漏洞版使用内存虚拟文档集合和教学查询解释器。

可展示的风险：

- 用户输入影响筛选条件语义。
- 固定受控样例触发“查询范围扩大”的学习信号。
- 后端日志记录风险类别和命中信号。

禁止能力：

- 不连接真实 MongoDB。
- 不执行任意对象查询。
- 不支持任意操作符。
- 不输出可复用到外部服务的查询 payload。

建议学习信号：

- `nosql-injection-query-expanded`
- `nosql-injection-operator-detected`
- `nosql-injection-safe-query-completed`

### 4.3 修复版

修复版只接受服务端定义的查询模板。

建议修复点：

- 查询字段固定为允许列表。
- 比较方式固定为服务端枚举。
- 用户输入只作为字符串值参与匹配。
- 拒绝对象型输入、数组型输入和未知查询模式。
- 日志只保存输入摘要，不保存完整查询结构。

建议学习信号：

- `nosql-injection-operator-blocked`
- `nosql-injection-schema-blocked`
- `nosql-injection-safe-query-completed`

### 4.4 后续实现建议

后续单独实现时，建议新增：

- `labs/web/nosql-injection/`
- `tools/lab-scripts/web/nosql-injection/`
- `apps/server/src/services/nosql-injection-lab.ts`
- `apps/server/tests/nosql-injection-lab.test.ts`
- `apps/web/src/api/nosql-injection-lab.ts`
- `apps/web/src/labs/nosql-injection.ts`
- `apps/web/src/views/NosqlInjectionLabView.vue`
- `apps/web/tests/nosql-injection-api.test.ts`
- `apps/web/tests/nosql-injection-lab.test.ts`

建议 API 形态在实现执行文档中再最终锁定，初步方向为：

```text
POST /api/labs/web/nosql-injection/:variant/search
```

## 5. CRLF 注入规划

### 5.1 场景定位

建议业务包装为“下载文件名 / 跳转提示 / 通知头部预览”。

学习目标：

- 理解 CR / LF 控制字符进入响应头构造流程后的风险。
- 理解输入规范化、控制字符拒绝和上下文编码的防御价值。

### 5.2 落地方式

推荐做真实交互页面，但后端只返回虚拟响应头预览。

漏洞版：

- 识别固定受控换行样例。
- 展示虚拟头部被拆分或污染的学习信号。

修复版：

- 拒绝 CR / LF。
- 限制文件名或标题字符集。
- 返回清晰阻断原因。

禁止能力：

- 不真实拆分 HTTP 响应。
- 不设置真实危险响应头。
- 不演示缓存投毒、Cookie 注入或代理链路影响。

## 6. XPath 注入规划

### 6.1 场景定位

建议业务包装为“XML 产品目录 / 权限策略查询预览”。

学习目标：

- 理解字符串拼接查询条件会改变 XML 查询语义。
- 理解固定查询模板和文本值转义的防御价值。

### 6.2 落地方式

一期建议先做模拟实验。

漏洞版：

- 使用虚拟 XML 数据集合。
- 固定受控样例触发“结果范围扩大”的学习信号。

修复版：

- 固定查询模板。
- 字段允许列表。
- 用户输入作为文本值处理。

禁止能力：

- 不读取真实 XML 文件。
- 不执行任意 XPath 表达式。
- 不接入外部 XML 数据源。

## 7. LDAP 注入规划

### 7.1 场景定位

建议业务包装为“组织成员搜索 / 权限组查询 / 登录筛选案例”。

学习目标：

- 理解目录服务过滤条件拼接风险。
- 理解过滤器转义、字段允许列表和服务端查询模板的防御价值。

### 7.2 落地方式

一期建议先做案例化，不做真实目录服务靶场。当前已补充前端虚拟目录工作台、Playwright 页面验证、只读一致性验证脚本和受控虚拟目录 API，用于承接漏洞案例、修复案例阅读路径、文档边界检查、页面交互观察和服务端事件日志差异验证，并已按 case-study ready 标准收口。

原因：

- 当前项目没有 LDAP 服务。
- Windows 本机无 Docker 约束下引入目录服务成本较高。
- LDAP 凭据与目录结构容易让实验边界变重。

案例内容建议：

- 输入如何进入过滤条件。
- 漏洞拼接前后的查询意图差异。
- 修复后如何进行过滤器转义和模板化。
- 真实生产中还需要最小权限、审计和账号锁定策略。
- 前端工作台只提交固定 `scenarioKey` 和 `keyword`，只展示后端安全摘要、学习信号和虚拟目录条目。
- 虚拟目录 API 只接受固定场景和关键词，只使用内存虚拟目录数据，不连接目录服务。
- Playwright 页面验证只在 localhost 中点击页面控件和受控样例按钮，不连接目录服务。
- 验证脚本只读取本仓库内固定 LDAP 文档和元数据，不连接目录服务，也不调用 API。
- ready 状态不表示存在攻击脚本；它表示页面、API、事件日志、文档、Playwright 和只读验证已经形成受控学习闭环。

禁止能力：

- 不连接真实 LDAP 服务。
- 不保存目录账号、组织结构或凭据。
- 不提供对外 LDAP 查询脚本。

## 8. 元数据策略

后续若先建占位元数据，应遵守：

- NoSQL 和 CRLF 可使用 `status: "planned"` 或 `in-progress` 后再进入实现。
- XPath 初始建议 `mode: "simulation"`。
- LDAP 初始建议 `mode: "case-study"`。
- 未有真实页面、API、脚本和手动验证文档前，不得标记为 `ready`。
- 变体仍建议保留 `vuln` / `fixed`，若案例化无法提供真实变体入口，必须在 README 中说明原因。

## 9. 后续切片

推荐后续按以下顺序推进：

1. `web/nosql-injection` 实现执行文档。
2. `web/nosql-injection` 元数据、文档和受控虚拟查询器实现。
3. `web/nosql-injection` 前端工作台、脚本和测试。
4. `web/crlf-injection` 实现执行文档。
5. `web/crlf-injection` 虚拟响应头预览实验。
6. `web/xpath-injection` 模拟实验设计。
7. `web/ldap-injection` 前端引导式工作台接入与验证。

当前执行状态（2026-06-30）：

- `web/nosql-injection` 已完成 ready 收口。
- `web/crlf-injection` 已完成 ready 收口。
- `web/xpath-injection` 已完成 ready 收口。
- `web/ldap-injection` 已完成案例化执行文档、目录、前端虚拟目录工作台、Playwright 页面验证、只读一致性验证脚本、受控虚拟目录 API、事件日志、`ready` 元数据和基础案例文档切片；当前仍不提供 LDAP 查询脚本、攻击脚本或真实目录服务。

每个切片完成后都必须同步 `docs/TODO.md` 和总纲。

## 10. 完成判定

本规划完成后，下一步应能明确回答：

- 为什么 NoSQL 注入可以进入真实交互实验。
- 为什么 NoSQL 不引入真实 MongoDB。
- 为什么 CRLF 只能做虚拟头部预览。
- 为什么 XPath 先做模拟而不是任意表达式执行。
- 为什么 LDAP 一期先案例化，并且虚拟目录 API 不能升级为真实目录服务连接。
- 后续每个实验从哪份执行文档开始。
