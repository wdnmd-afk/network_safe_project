# 2026-06-30 LDAP 注入前端工作台接入执行文档

## 目标

将 `web/ldap-injection` 已实现的受控虚拟目录 API 接入前端引导式工作台，让学习者可以在漏洞版与修复版页面中提交固定场景、正常关键词和受控学习样例，并观察后端决策、学习信号、结果范围和安全摘要。

本轮继续保持 LDAP 实验的一期边界：不连接真实 LDAP、AD 或 OpenLDAP 服务，不创建对外 LDAP 查询脚本，不提供通用过滤器 payload 库，也不展示原始 `inputSummaryJson`。

## 范围

- 新增前端 API client：`apps/web/src/api/ldap-injection-lab.ts`。
- 扩展前端实验模型：`apps/web/src/labs/ldap-injection.ts`。
- 改造页面：`apps/web/src/views/LdapInjectionLabView.vue`。
- 补充前端单元测试：`apps/web/tests/ldap-injection-api.test.ts` 与 `apps/web/tests/ldap-injection-lab.test.ts`。
- 同步 LDAP 场景元数据、实验文档、验证脚本、共享元数据测试和总目标进度文档。

不在本轮范围内：

- 不新增 `exploit.py`。
- 不连接真实目录服务。
- 不执行任意 LDAP 过滤器。
- 不保存或展示目录账号、DN、邮箱、手机号、凭据、Cookie、token 或外部目标信息。

## 操作步骤

1. 复核现有前端工作台模式，优先参考 XPath / NoSQL 注入实验的 API client、helper、页面提交、学习记录和验证记录写法。
2. 新增 LDAP 前端 API client，字段严格对齐后端 `apps/server/src/services/ldap-injection-lab.ts` 已确认响应结构。
3. 扩展 LDAP helper：
   - 注册正常样例：`member-search` + `alice`。
   - 注册受控样例：`LAB_CONTROLLED_LDAP:expand-directory-scope`。
   - 增加学习进度与验证记录载荷生成函数。
   - 补齐虚拟目录 API 返回信号的中文展示。
4. 改造 LDAP 页面：
   - 保留案例观察与复盘清单。
   - 新增场景选择、关键词输入、正常样例按钮、受控样例按钮和提交按钮。
   - 只展示后端决策、信号、条目数量、关键词长度、脱敏预览、风险类型、是否命中受控样例、结果范围和虚拟目录条目。
5. 同步元数据与文档描述，将页面从静态案例页更新为“案例 + 虚拟目录工作台”。
6. 保持脚本入口为只读一致性验证脚本，必要时更新一致性检查文案与断言。
7. 运行最小必要验证与安全扫描。

## 实施建议

- 前端 API client 允许 400 / 403 / 404 返回业务响应体，与 XPath / NoSQL 工作台保持一致。
- 验证记录只在命中预期差异信号时写入：
  - 漏洞版：`ldap-injection-scope-expanded`。
  - 修复版：`ldap-injection-controlled-sample-blocked` 或 `ldap-injection-input-blocked`。
- 页面展示必须避免“原始过滤器”“完整输入摘要”“目录连接信息”等内容，只展示后端已脱敏字段。
- `supportsAutomation` 继续保持 `false`，因为本轮仍不提供攻击脚本自动化；元数据的 automation 仅表示 API 测试和只读一致性验证脚本存在。

## 潜在风险分析

- 若前端文案把受控学习样例描述成通用 payload，可能误导为对外攻击能力；需要明确这是本项目固定教学样例。
- 若页面展示后端日志原始摘要字段，可能破坏既有日志安全边界；本轮禁止展示 `inputSummaryJson`。
- 若验证脚本把前端工作台误判成攻击脚本自动化，元数据会与安全边界冲突；本轮保留只读验证脚本定位。
- 若字段名未对齐后端响应结构，页面和验证记录可能写入错误数据；字段来源以服务端类型为准，不做多字段兜底。

## 优化方案

- 后续如果需要进一步收口，可为 LDAP 单独增加 Playwright 场景，但仍只允许 localhost 与受控样例。
- 后续如果要进入 `ready`，需要明确是否增加本机受控脚本；若仍不提供攻击脚本，则应在完成标准中为 LDAP 记录例外原因。
- 后续可把注入类工作台的状态面板抽成统一组件，减少 XPath / NoSQL / LDAP 的重复展示逻辑。

## 验证方式

- `pnpm --filter @network-safe/web exec vitest run tests/ldap-injection-api.test.ts tests/ldap-injection-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts`
- `pnpm --filter @network-safe/shared test`
- `git diff --check -- <本轮变更文件>`
- `rg -n "[ \t]+$" <本轮变更文件>`
- 对 LDAP 前端、helper、API client、文档和脚本执行安全关键词扫描，确认未新增真实目录连接、外部请求、动态执行、命令执行或原始日志摘要展示。
