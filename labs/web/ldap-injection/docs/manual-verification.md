# LDAP 注入手动验证

## 验证目标

本阶段验证 case-study ready 收口：前端工作台、受控虚拟目录 API、事件日志摘要、文档切片、Playwright 页面验证和本机只读一致性验证脚本形成完整证据链，但不验证真实目录服务或攻击脚本。

## 元数据检查

1. 打开 `labs/web/ldap-injection/meta.json`。
2. 确认 `id` 为 `web.ldap-injection`。
3. 确认 `mode` 为 `case-study`。
4. 确认 `status` 为 `ready`。
5. 确认 `entrypoints.web` 只包含漏洞版和修复版两个前端工作台。
6. 确认 `entrypoints.api` 只包含漏洞版和修复版两个虚拟目录查询接口。
7. 确认 `entrypoints.scripts` 只包含 `tools/lab-scripts/web/ldap-injection/verify.ts`。
8. 确认 `entrypoints.docs` 只包含已存在的文档入口。
9. 确认 `verification.automation.supported` 为 `true`，且登记 Playwright 页面验证、API 测试和 `ldap-injection-verify` 脚本验证入口。
10. 确认 `variants[].supportsAutomation` 均为 `false`，表示没有攻击脚本自动化。
11. 确认 `safeBoundaries` 和 `notes` 说明当前 ready 采用 case-study 例外标准，不提供 `exploit.py` 或 LDAP 查询脚本。

## ready 收口检查

LDAP 注入当前可以标记为 `ready`，但原因不是具备攻击脚本，而是满足以下替代闭环：

- 漏洞版和修复版均有前端虚拟目录工作台。
- 漏洞版和修复版均有受控虚拟目录 API。
- 服务端测试覆盖正常查询、漏洞版扩大范围、修复版阻断、未知场景拒绝和日志摘要。
- Playwright 验证覆盖漏洞版扩大范围与修复版阻断的页面差异。
- 只读验证脚本覆盖元数据、文档入口和安全边界。
- 文档明确禁止真实目录服务、目录命令、对外查询脚本、payload 库和任意过滤器执行器。

## 前端工作台检查

1. 打开 `/labs/web/ldap-injection/vuln`。
2. 确认页面展示组织成员搜索、权限组查询和登录筛选三个固定案例。
3. 登录后先点击“填入正常查询”，提交虚拟目录查询。
4. 确认漏洞版正常关键词返回 `ldap-injection-safe-search-completed`，并且页面只展示关键词长度、脱敏预览、风险类型、结果范围和虚拟目录条目。
5. 点击“填入受控样例”，提交虚拟目录查询。
6. 确认漏洞版返回 `ldap-injection-scope-expanded`，结果范围为 `expanded`。
7. 打开 `/labs/web/ldap-injection/fixed`。
8. 提交同样受控样例，确认修复版返回 `ldap-injection-controlled-sample-blocked`，结果范围为 `blocked`。
9. 确认两个页面都不要求填写目录账号、连接地址、DN、凭据或外部目标。
10. 确认页面不展示原始输入摘要 JSON，也不展示真实 LDAP 过滤器字符串。

## 文档检查

检查以下文件存在：

- `labs/web/ldap-injection/README.md`
- `labs/web/ldap-injection/vuln/README.md`
- `labs/web/ldap-injection/fixed/README.md`
- `labs/web/ldap-injection/mock/README.md`
- `labs/web/ldap-injection/docs/attack-steps.md`
- `labs/web/ldap-injection/docs/fix-notes.md`
- `labs/web/ldap-injection/docs/manual-verification.md`

## 安全边界检查

文档必须明确：

- 不连接真实 LDAP / AD / OpenLDAP 服务。
- 不进行真实 bind、search、modify 或 delete 操作。
- 不保存目录账号、组织结构、DN、邮箱、手机号或凭据。
- 不请求外部目标。
- 不提供对外 LDAP 查询脚本。
- 不提供通用过滤器 payload 库。
- 不实现任意 LDAP 过滤器执行器。

## API 检查

当前后端 API 只验证虚拟目录模拟器：

- `POST /api/labs/web/ldap-injection/vuln/search`
- `POST /api/labs/web/ldap-injection/fixed/search`

请求体只允许固定业务字段：

- `scenarioKey`
- `keyword`

服务端测试应确认：

- 正常关键词只返回虚拟公开范围结果。
- 漏洞版受控学习样例返回 `ldap-injection-scope-expanded`。
- 修复版同样样例返回 `ldap-injection-controlled-sample-blocked`。
- 事件日志只写入场景、关键词长度、脱敏预览、风险类型、结果范围、条目数量和学习信号。
- API 不连接真实 LDAP / AD / OpenLDAP 服务。

## 自动化检查

```powershell
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts
pnpm --filter @network-safe/server test -- tests/ldap-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts
pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/web exec vitest run tests/ldap-injection-api.test.ts tests/ldap-injection-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/testing e2e -- --grep "LDAP"
git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/execution/2026-06-30-web-ldap-injection-static-case-page.md docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md docs/execution/2026-06-30-web-ldap-injection-virtual-directory-api.md docs/execution/2026-06-30-web-ldap-injection-frontend-workbench.md docs/execution/2026-06-30-web-ldap-injection-playwright-verification.md docs/execution/2026-06-30-web-ldap-injection-ready-closeout.md labs/web/ldap-injection tools/lab-scripts/web/ldap-injection apps/server/src/app.ts apps/server/src/services/ldap-injection-lab.ts apps/server/tests/ldap-injection-lab.test.ts apps/server/tests/health.test.ts apps/server/tests/lab-registry.test.ts apps/web/src/api/ldap-injection-lab.ts apps/web/src/labs/ldap-injection.ts apps/web/src/views/LdapInjectionLabView.vue apps/web/src/router/routes.ts apps/web/tests/ldap-injection-api.test.ts apps/web/tests/ldap-injection-lab.test.ts apps/web/tests/router.test.ts packages/shared/tests/lab-metadata.test.mjs packages/testing/src/smoke/config.mjs packages/testing/tests/smoke-config.test.mjs packages/testing/tests/e2e/platform.spec.mjs
rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/execution/2026-06-30-web-ldap-injection-static-case-page.md docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md docs/execution/2026-06-30-web-ldap-injection-virtual-directory-api.md docs/execution/2026-06-30-web-ldap-injection-frontend-workbench.md docs/execution/2026-06-30-web-ldap-injection-playwright-verification.md docs/execution/2026-06-30-web-ldap-injection-ready-closeout.md labs/web/ldap-injection tools/lab-scripts/web/ldap-injection apps/server/src/app.ts apps/server/src/services/ldap-injection-lab.ts apps/server/tests/ldap-injection-lab.test.ts apps/server/tests/health.test.ts apps/server/tests/lab-registry.test.ts apps/web/src/api/ldap-injection-lab.ts apps/web/src/labs/ldap-injection.ts apps/web/src/views/LdapInjectionLabView.vue apps/web/src/router/routes.ts apps/web/tests/ldap-injection-api.test.ts apps/web/tests/ldap-injection-lab.test.ts apps/web/tests/router.test.ts packages/shared/tests/lab-metadata.test.mjs packages/testing/src/smoke/config.mjs packages/testing/tests/smoke-config.test.mjs packages/testing/tests/e2e/platform.spec.mjs
```

## 不验证的内容

本阶段不验证：

- Python 攻击脚本。
- LDAP 查询脚本。

当前前端工作台、后端 API 和事件日志写入通过前端 API/helper 测试与服务端测试验证。当前唯一脚本入口仍是只读文档一致性验证脚本。
