# LDAP 注入文档一致性验证脚本执行文档

## 1. 目标

本轮目标是在 `web/ldap-injection` 已有案例化文档和静态页面基础上，补充一个本机只读一致性验证脚本。

该脚本用于验证：

- LDAP 元数据仍保持 `case-study` 和 `in-progress`。
- 漏洞案例 / 修复案例静态页面入口已登记。
- 虚拟目录 API 入口只包含漏洞版和修复版 search 接口。
- 脚本目录只包含文档一致性验证入口，不包含攻击脚本。
- 文档继续明确不连接真实 LDAP 服务、不保存目录账号或凭据、不提供对外查询脚本。

本轮不把 LDAP 实验标记为 `ready`，也不引入真实目录服务或交互式查询。

## 2. 范围

本轮包含：

- 新增 `tools/lab-scripts/web/ldap-injection/README.md`。
- 新增 `tools/lab-scripts/web/ldap-injection/verify.ts`。
- 更新 `labs/web/ldap-injection/meta.json`，登记 `ldap-injection-verify` 脚本入口。
- 更新 `verification.automation`，登记 API 测试和文档一致性验证脚本。
- 更新 LDAP README、手动验证文档和相关进度文档。
- 更新共享元数据测试。

本轮不包含：

- 不新增 `exploit.py`。
- 不通过该脚本调用后端 API。
- 不新增数据库表或迁移。
- 不写入 `lab_event_logs`。
- 不连接真实 LDAP / AD / OpenLDAP 服务。
- 不执行真实 bind、search、modify 或 delete。
- 不请求外部目标。
- 不读取本机目录服务配置。
- 不生成过滤器 payload 库。

## 3. 实施建议

`verify.ts` 只做项目内文件验证：

1. 从脚本所在目录反推仓库根目录。
2. 读取 `labs/web/ldap-injection/meta.json`。
3. 读取 LDAP README、攻击步骤、修复说明、手动验证文档和静态页面执行文档。
4. 检查元数据字段、入口数组、脚本入口和自动化标记是否与当前实现一致。
5. 检查关键文档是否包含安全边界声明。
6. 检查目标文档中未出现真实连接地址、目录命令或外部目标描述。
7. 输出结构化 JSON 报告；若任何检查失败，进程退出码为 1。

脚本允许读取仓库内固定文件。除此之外，不允许网络请求、目录服务连接、命令执行、动态执行或外部路径扫描。

## 4. 元数据策略

本轮更新后：

- `status` 保持 `in-progress`。
- `mode` 保持 `case-study`。
- `entrypoints.web` 保持漏洞案例 / 修复案例两个静态页面。
- `entrypoints.api` 登记漏洞版和修复版虚拟目录查询接口。
- `entrypoints.scripts` 只登记 `tools/lab-scripts/web/ldap-injection/verify.ts`。
- `variants[].supportsAutomation` 继续为 `false`，因为当前没有攻击脚本自动化入口。
- `verification.automation.supported` 改为 `true`。
- `verification.automation.apiTest` 指向 `apps/server/tests/ldap-injection-lab.test.ts`。
- `verification.automation.scriptVerification.scriptKeys` 只包含 `ldap-injection-verify`。

## 5. 潜在风险分析

- 如果脚本被命名为攻击脚本或生成过滤器样例，会破坏 LDAP 案例化边界，因此本轮只创建 `verify.ts`。
- 如果自动化标记没有解释清楚，可能被误解为 LDAP 已具备对外攻击脚本，因此文档必须明确它只包含本机虚拟 API 测试和文档一致性验证。
- 如果脚本读取任意用户路径，会扩大本机文件访问范围，因此脚本只读取固定仓库文件。
- 如果脚本扫描关键字时包含自身命令词，容易造成自命中，因此危险词检查只作用于目标文档内容。

## 6. 验证方式

本轮完成后运行：

```powershell
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts
pnpm --filter @network-safe/shared test
git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/execution/2026-06-30-web-ldap-injection-static-case-page.md docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md docs/design/injection-remaining-labs.md labs/web/ldap-injection tools/lab-scripts/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs
rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/execution/2026-06-30-web-ldap-injection-static-case-page.md docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md docs/design/injection-remaining-labs.md labs/web/ldap-injection tools/lab-scripts/web/ldap-injection packages/shared/tests/lab-metadata.test.mjs
```

另需对 `tools/lab-scripts/web/ldap-injection/` 执行安全边界扫描，确认未出现网络请求、目录服务连接、动态执行或命令执行能力。该脚本会读取项目内固定文档，因此文件读取相关能力属于本轮允许范围。

## 7. 完成判定

本轮完成后应满足：

- LDAP 脚本目录只包含 README 与 `verify.ts`。
- `verify.ts` 可以输出一致性验证报告并在检查失败时返回非零退出码。
- LDAP 元数据登记虚拟目录 API 和只读脚本入口。
- LDAP 仍为 `case-study/in-progress`，不标记为 `ready`。
- 共享元数据测试通过。
- 文档和脚本空白检查通过。
- 安全扫描确认没有外部请求、真实目录服务连接、动态执行或命令执行能力。

## 8. 本轮执行结果

本轮已按本文档完成文档一致性验证脚本切片：

- 新增 `tools/lab-scripts/web/ldap-injection/README.md`。
- 新增 `tools/lab-scripts/web/ldap-injection/verify.ts`。
- 更新 `labs/web/ldap-injection/meta.json`，登记 `ldap-injection-verify` 脚本入口。
- 更新 LDAP README、手动验证文档、TODO、总纲和注入类规划文档。
- 更新共享元数据测试，确认 LDAP 当前只登记静态页面、虚拟目录 API、文档和一致性验证脚本。

验证记录：

- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- LDAP 脚本目录与场景文档安全关键词扫描未命中。

当前限制：

- 后续虚拟目录 API 切片已补充受控后端 API 和事件日志写入。
- 仍无 LDAP 查询脚本或攻击脚本。
- 仍不连接真实 LDAP / AD / OpenLDAP 服务。
