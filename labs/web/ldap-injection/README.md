# LDAP 注入

## 实验目标

本实验通过案例化方式学习 LDAP 注入风险：

1. 攻击方如何观察用户输入是否进入目录服务过滤条件。
2. 漏洞案例为什么会让查询语义偏离原本业务意图。
3. 修复案例为什么需要服务端查询模板、字段允许列表、过滤器转义和权限边界。
4. 真实生产中为什么还要补充最小权限目录账号、日志审计和账号策略。

## 当前状态

当前实验处于 `ready` 状态，落地方式为 `case-study` + 受控虚拟目录工作台：

- 已建立实验目录、元数据和基础案例文档。
- 已补充漏洞版 / 修复版前端引导式工作台。
- 已补充受控后端虚拟目录 API，用于服务端测试和事件日志差异验证。
- 前端工作台可提交固定 `scenarioKey` 与 `keyword`，展示后端决策、学习信号、脱敏预览、风险类型和虚拟目录条目。
- 当前登记 web、api、docs 与只读验证脚本入口。
- 当前已登记 Playwright 页面验证，用于确认漏洞版和修复版工作台差异。
- 当前 ready 按 case-study 例外收口标准判定，不创建 LDAP 查询脚本或攻击脚本。
- 当前脚本入口仍只做文档、元数据和入口一致性验证。

## 案例范围

本阶段只覆盖三个固定案例：

- 组织成员搜索：观察姓名关键词是否影响组织范围条件。
- 权限组查询：观察组名输入是否影响权限组可见范围。
- 登录筛选案例：观察用户名定位是否依赖可拼接过滤条件。

这些案例只描述风险意图、业务边界和修复方式，不输出可直接复用的过滤器字符串。

## 安全边界

- 不连接真实 LDAP / AD / OpenLDAP 服务。
- 不进行真实 bind、search、modify 或 delete 操作。
- 不保存目录账号、组织结构、DN、真实邮箱、真实手机号或凭据。
- 不读取本机目录服务配置。
- 不请求外部目标。
- 不提供对外 LDAP 查询脚本。
- 不提供通用过滤器 payload 库。
- 不实现任意 LDAP 过滤器执行器。
- 不在前端展示原始输入摘要 JSON。

## 当前入口

当前存在前端工作台入口：

- 漏洞版工作台：`/labs/web/ldap-injection/vuln`
- 修复版工作台：`/labs/web/ldap-injection/fixed`

当前文档入口：

- [攻击步骤](docs/attack-steps.md)
- [修复说明](docs/fix-notes.md)
- [手动验证](docs/manual-verification.md)
- [实现执行文档](../../../docs/execution/2026-06-30-web-ldap-injection-lab.md)
- [静态案例页执行文档](../../../docs/execution/2026-06-30-web-ldap-injection-static-case-page.md)
- [一致性验证脚本执行文档](../../../docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md)
- [虚拟目录 API 执行文档](../../../docs/execution/2026-06-30-web-ldap-injection-virtual-directory-api.md)
- [前端工作台执行文档](../../../docs/execution/2026-06-30-web-ldap-injection-frontend-workbench.md)
- [ready 收口执行文档](../../../docs/execution/2026-06-30-web-ldap-injection-ready-closeout.md)

当前 API 入口：

- 漏洞版虚拟目录查询：`POST /api/labs/web/ldap-injection/vuln/search`
- 修复版虚拟目录查询：`POST /api/labs/web/ldap-injection/fixed/search`

该 API 只接受固定 `scenarioKey` 和 `keyword`，只使用内存虚拟目录数据，不连接真实目录服务。

当前脚本入口：

- `tools/lab-scripts/web/ldap-injection/verify.ts`

该脚本只验证本仓库内 LDAP 文档、元数据和入口一致性，不发起 LDAP 查询。

当前页面级验证入口：

- `packages/testing/tests/e2e/platform.spec.mjs`

该 Playwright 用例只在 localhost 页面中点击正常控件和受控样例按钮，不连接真实目录服务。

## 后续方向

后续若要升级为真实目录靶场或新增攻击脚本，必须重新编写执行文档并评估安全边界。当前 ready 不包含真实目录服务、真实凭据、LDAP 查询脚本或可复制攻击字符串。
