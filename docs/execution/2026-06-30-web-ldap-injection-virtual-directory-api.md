# LDAP 注入虚拟目录 API 执行文档

## 1. 目标

本轮目标是在 `web/ldap-injection` 现有案例化页面和文档基础上，新增一个受控的本机后端模拟接口，让学习者可以观察漏洞版与修复版在“目录查询语义被输入影响”时的判定差异。

本轮仍然不连接真实 LDAP、AD 或 OpenLDAP 服务。后端只使用内存中的虚拟目录数据，并且只处理固定业务场景。

## 2. 范围

本轮包含：

- 新增 LDAP 虚拟目录服务：`apps/server/src/services/ldap-injection-lab.ts`。
- 新增后端 API：`POST /api/labs/web/ldap-injection/:variant/search`。
- API 只允许固定字段：
  - `scenarioKey`
  - `keyword`
- 将 API 调用接入 `lab_event_logs` 统一事件日志。
- 更新 `labs/web/ldap-injection/meta.json`，登记已实现 API 和 API 测试。
- 更新 LDAP 场景文档、TODO、主目标和剩余注入规划。
- 新增服务端测试，覆盖服务层差异、鉴权、事件日志安全摘要和修复版阻断。
- 继续保留只读一致性验证脚本，不新增 `exploit.py`。

本轮不包含：

- 不新增前端 API client 或交互式工作台页面。
- 不新增 Python 攻击脚本。
- 不连接真实目录服务。
- 不实现任意 LDAP 过滤器执行器。
- 不提供通用过滤器 payload 库。
- 不读取本机目录服务配置、真实组织结构、DN、邮箱、手机号或凭据。

## 3. 方案

### 3.1 后端业务包装

后端使用“虚拟目录搜索”包装 LDAP 注入学习点，固定支持三个场景：

- `member-search`：组织成员搜索。
- `group-lookup`：权限组查询。
- `login-filter`：登录候选用户筛选。

服务层只根据 `scenarioKey` 和 `keyword` 在内存虚拟数据中产生教学结果，不生成、不拼接、不执行真实 LDAP 过滤器。

### 3.2 受控学习样例

服务层内部允许识别一个固定学习样例标记，用于模拟“输入改变目录查询语义”的差异信号。

约束：

- 样例只在本项目后端测试和本机受控请求中使用。
- 文档不把它描述为真实可复用过滤器。
- 日志不保存原始 `keyword`。
- 响应不返回原始受控样例，只返回长度、脱敏预览和学习信号。

### 3.3 API 行为

API 路径：

```text
POST /api/labs/web/ldap-injection/:variant/search
```

变体：

- `vuln`
- `fixed`

请求字段：

```json
{
  "scenarioKey": "member-search",
  "keyword": "alice"
}
```

预期结果：

- 正常关键词：漏洞版和修复版都只返回虚拟公开范围结果。
- 受控学习样例 + 漏洞版：返回虚拟教学隐藏结果，信号为 `ldap-injection-scope-expanded`。
- 受控学习样例 + 修复版：阻断，信号为 `ldap-injection-controlled-sample-blocked`。
- 未知场景：失败，信号为 `ldap-injection-template-not-found`。
- 非受控风险输入：阻断，避免实验变成任意过滤器模拟器。

### 3.4 事件日志摘要

`inputSummary` 只允许保存：

- `scenarioKey`
- `keywordLength`
- `keywordPreview`
- `detectedRiskTypes`
- `matchedControlledSample`
- `resultScope`
- `entryCount`
- `signal`

不得保存：

- 原始 `keyword`
- LDAP 过滤器字符串
- 真实账号、DN、邮箱、手机号、凭据
- 外部目标信息
- 原始 `inputSummaryJson` 前端展示

## 4. 操作步骤

1. 新增执行文档，锁定本轮 API 范围和安全边界。
2. 新增 `apps/server/src/services/ldap-injection-lab.ts`。
3. 在 `apps/server/src/app.ts` 注册 LDAP 服务、变体读取、日志摘要和 API 路由。
4. 新增 `apps/server/tests/ldap-injection-lab.test.ts`。
5. 更新 `labs/web/ldap-injection/meta.json`：
   - 保持 `status: "in-progress"`。
   - 保持 `mode: "case-study"`，本轮只是为案例页补充后端虚拟 API，不直接升级为完整交互式实验。
   - 登记两个 API 入口和 API 测试。
6. 更新共享元数据测试。
7. 更新 LDAP README、手动验证文档、主执行文档、TODO 和注入规划文档。
8. 运行最小验证和安全扫描。

## 5. 实施建议

- 优先复用 `nosql-injection-lab.ts` 与 `xpath-injection-lab.ts` 的服务边界。
- 服务层返回脱敏后的 `keywordPreview`，避免 `app.ts` 重新接触敏感输入。
- `app.ts` 只把服务层返回的摘要字段写入事件日志。
- 测试需要明确断言日志摘要不包含受控样例原文。
- 元数据只登记真实已实现入口，不登记后续前端 API client 或脚本入口。

## 6. 潜在风险分析

- 如果实现任意 LDAP 过滤器解析，会偏离本项目安全边界，因此本轮只识别固定场景和固定学习样例。
- 如果日志保存原始关键词，可能把受控样例或未来敏感输入落库，因此只记录长度、脱敏预览和风险类别。
- 如果把 `mode` 改成 `simulation`，可能让当前静态页面和只读脚本状态被误解为完整交互式实验；本轮保持 `case-study`，并在文档中说明 API 是虚拟目录补充能力。
- 如果新增 `exploit.py`，容易被理解成 LDAP 查询脚本；本轮不新增攻击脚本。

## 7. 优化方案

- 后续如果要做前端交互式工作台，应另写执行文档，复用本轮 API，并继续只展示脱敏摘要。
- 后续如需脚本验证，只允许 TypeScript 本机验证脚本调用本项目 localhost API，不提供真实目录查询能力。
- 可以在页面中把 LDAP 与 SQL / NoSQL / XPath 做横向比较，突出“输入不能改变查询结构”这个共同防线。

## 8. 验证方式

本轮完成后运行：

```powershell
pnpm --filter @network-safe/server test -- tests/ldap-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts
pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts
git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md docs/execution/2026-06-30-web-ldap-injection-virtual-directory-api.md docs/design/injection-remaining-labs.md labs/web/ldap-injection apps/server/src/app.ts apps/server/src/services/ldap-injection-lab.ts apps/server/tests/ldap-injection-lab.test.ts packages/shared/tests/lab-metadata.test.mjs
rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-ldap-injection-lab.md docs/execution/2026-06-30-web-ldap-injection-consistency-verify.md docs/execution/2026-06-30-web-ldap-injection-virtual-directory-api.md docs/design/injection-remaining-labs.md labs/web/ldap-injection apps/server/src/app.ts apps/server/src/services/ldap-injection-lab.ts apps/server/tests/ldap-injection-lab.test.ts packages/shared/tests/lab-metadata.test.mjs
```

安全扫描：

```powershell
rg -n "ldap://|ldaps://|ldapsearch|ldapmodify|ldapdelete|ldapadd|bindDN|password|process\.env|createReadStream|readFile|http\.request|https\.request|eval\(|new Function|child_process|inputSummaryJson" apps/server/src/services/ldap-injection-lab.ts labs/web/ldap-injection tools/lab-scripts/web/ldap-injection docs/execution/2026-06-30-web-ldap-injection-virtual-directory-api.md
```

服务层单独扫描必须零命中。若文档中命中禁止性说明，需要人工确认只是边界说明。

## 9. 完成判定

本轮完成后应满足：

- LDAP 后端 API 只使用内存虚拟目录数据。
- 漏洞版和修复版在固定受控样例上有可测试差异。
- 事件日志只写安全摘要，不保存原始关键词。
- 元数据登记 API 入口和 API 测试，仍不登记攻击脚本。
- 文档持续声明不连接真实 LDAP、AD 或 OpenLDAP 服务。
- 最小验证和安全扫描通过。

## 10. 本轮执行结果

本轮已完成 LDAP 注入受控虚拟目录 API 后端切片：

- 新增 `apps/server/src/services/ldap-injection-lab.ts`。
- 新增 `POST /api/labs/web/ldap-injection/:variant/search`。
- 新增 `apps/server/tests/ldap-injection-lab.test.ts`。
- 更新 `labs/web/ldap-injection/meta.json`，登记虚拟目录 API 和 API 测试。
- 更新 `tools/lab-scripts/web/ldap-injection/verify.ts`，校验静态页面、虚拟目录 API、文档和脚本入口一致性。
- 更新 LDAP 场景文档、TODO、总纲和注入规划文档。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/ldap-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，154 项通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- `apps/server/src/services/ldap-injection-lab.ts` 安全关键词扫描未命中。
- LDAP 场景文档、脚本目录和本执行文档广义安全扫描仅命中本文禁止展示原始 `inputSummaryJson` 的说明和扫描命令本身。

当前仍不包含：

- Python 攻击脚本。
- LDAP 查询脚本。
- 真实 LDAP / AD / OpenLDAP 服务连接。
- 任意 LDAP 过滤器执行器。
