# XPath 注入实验实现执行文档

## 1. 目标

实现 `web/xpath-injection` 前，先锁定业务包装、接口契约、安全边界、日志摘要、脚本边界和验证方式。

本实验目标是让学习者从攻击方视角观察：

- 用户输入被拼接进 XML 查询条件后，为什么可能改变查询语义。
- 漏洞版为什么会出现“虚拟结果范围扩大”的学习信号。
- 修复版为什么必须使用固定查询模板、字段允许列表和文本值处理。
- 事件日志如何记录风险类别和学习信号，而不是保存完整危险输入或查询表达式。

本实验不以提供真实 XPath 表达式执行能力为目标。

## 2. 范围

后续实现范围：

- `labs/web/xpath-injection/` 实验目录。
- `tools/lab-scripts/web/xpath-injection/` 本机受控脚本目录。
- 后端虚拟 XML 产品目录查询模拟 service。
- 后端受控 API。
- 前端 API client、实验 helper、工作台页面和路由入口。
- 元数据、文档、脚本和最小测试。

本轮先完成执行文档、目录、元数据和基础说明，不直接实现后端 API 或前端页面。

## 3. 业务包装

建议业务包装为“XML 产品目录查询预览”。

学习者看到的是一个业务查询场景：

- 正常用户输入商品关键词，服务端在虚拟产品目录中查询公开商品。
- 攻击方尝试让输入影响查询条件语义。
- 漏洞版只在虚拟查询模拟器中展示结果范围扩大。
- 修复版在进入虚拟查询模拟器前进行模板和文本值约束。

选择该包装的原因：

- 不需要真实 XML 文件、不需要外部 XML 服务。
- 容易映射 XPath 注入中的“字符串拼接查询条件”风险。
- 可以用虚拟产品文档结果展示“正常范围”和“扩大范围”的差异。
- 便于统一事件日志记录脱敏摘要。

## 4. 安全边界

后续实现必须遵守：

- 不读取真实 XML 文件。
- 不执行任意 XPath 表达式。
- 不接入外部 XML 数据源。
- 不引入 XML 查询引擎作为任意表达式执行器。
- 不访问外部目标。
- 不读取真实本机文件。
- 不保存完整危险输入、完整查询表达式、真实 token、真实 Cookie 或外部目标信息。
- 所有攻击样例只面向 localhost / 127.0.0.1 / ::1 的本项目接口。
- 不提供可迁移到外部目标的 XPath payload 库。

## 5. 建议接口契约

后续 API 建议为：

```text
POST /api/labs/web/xpath-injection/:variant/search
```

其中 `variant` 只能为：

- `vuln`
- `fixed`

建议请求体字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `queryTemplate` | `string` | 固定查询模板，初期只允许 `product-catalog-by-name` |
| `keyword` | `string` | 普通业务关键词 |
| `scope` | `string` | 固定查询范围，初期只允许 `public-catalog` |

字段约束：

- `queryTemplate` 必须走固定允许列表。
- `scope` 必须走固定允许列表。
- `keyword` 只作为文本值进入虚拟查询。
- 漏洞版只识别固定受控样例，不支持任意 XPath 表达式。
- 修复版发现受控风险样例或未知模板时直接阻断。

建议固定受控样例：

```text
LAB_CONTROLLED_XPATH:expand-product-catalog
```

该样例只能触发虚拟结果范围扩大，不得转换为真实 XPath 表达式。

## 6. 后端设计

建议新增：

```text
apps/server/src/services/xpath-injection-lab.ts
```

service 负责：

- 维护虚拟产品目录数据集合。
- 维护固定查询模板和固定查询范围。
- 识别固定受控 XPath 注入学习样例。
- 生成漏洞版和修复版不同判定。
- 返回学习信号、虚拟查询摘要、虚拟文档结果和面向学习者的说明。
- 写入统一实验事件日志。

虚拟结果建议结构：

- `id`
- `name`
- `category`
- `visibility`: `public` / `internal`
- `matchedBy`: `keyword` / `controlled-expanded-scope`

不得返回完整危险输入或完整查询表达式；需要展示时只返回脱敏预览或固定学习标签。

## 7. 漏洞版行为

漏洞版用于展示“输入改变查询语义后结果范围扩大”的风险。

建议行为：

- 正常关键词只返回公开产品目录中的匹配结果。
- 固定受控样例触发虚拟结果范围扩大。
- 虚拟结果中可以出现 `internal` 可见性文档，但必须标记为教学模拟结果。
- 日志记录风险类别、是否命中受控样例和学习信号。

建议学习信号：

- `xpath-injection-safe-query-completed`
- `xpath-injection-controlled-sample-detected`
- `xpath-injection-result-scope-expanded`

漏洞版不得：

- 执行任意 XPath 表达式。
- 读取真实 XML 文件或外部 XML 数据。
- 返回可直接复用于外部目标的 payload 库。
- 执行网络请求或文件读取。

## 8. 修复版行为

修复版用于展示服务端查询模板和文本值边界。

建议行为：

- 只接受固定 `queryTemplate`。
- 只接受固定 `scope`。
- `keyword` 只作为文本值参与匹配。
- 发现固定受控样例或未知模板时阻断。
- 正常关键词仍可完成虚拟查询。

建议学习信号：

- `xpath-injection-safe-query-completed`
- `xpath-injection-controlled-sample-blocked`
- `xpath-injection-template-not-found`

修复说明必须强调：

- 修复不是靠前端隐藏输入框。
- 修复点在服务端固定查询模板、字段允许列表和文本值处理。
- 日志只记录摘要，不保存完整 keyword 或完整查询条件。

## 9. 事件日志设计

统一写入 `lab_event_logs`。

建议字段：

- `labKey`: `web.xpath-injection`
- `variantKey`: `vuln` / `fixed`
- `phase`: `attack` / `defense` / `normal`
- `actorPerspective`: `attacker` / `user` / `system`
- `eventType`: `validation`
- `decision`: `accepted` / `blocked` / `failed`
- `signal`: 学习信号
- `riskLevel`: `high`

`inputSummary` 建议只包含：

- `queryTemplate`
- `scope`
- `keywordLength`
- `keywordPreview`
- `detectedRiskTypes`
- `matchedControlledSample`
- `resultScope`
- `documentCount`
- `signal`

不得包含：

- 完整 `keyword`
- 完整 XPath 表达式
- 完整危险样例
- 真实 Cookie / token
- 外部目标信息
- 前端展示原始输入摘要 JSON

## 10. 前端页面设计

建议新增：

```text
apps/web/src/views/XpathInjectionLabView.vue
```

页面沿用已有注入实验工作台：

- 当前实验名称。
- 漏洞版 / 修复版视角。
- 正常关键词样例按钮。
- 受控 XPath 样例按钮。
- 当前请求摘要。
- 后端判定结果。
- 学习信号。
- 虚拟产品目录结果。
- 日志摘要说明。
- 下一步建议。

页面不展示完整危险输入，不提供通用 payload 库，不暗示可以对外部站点复用。

## 11. 文档与脚本

实验目录：

```text
labs/web/xpath-injection/
├─ meta.json
├─ README.md
├─ vuln/README.md
├─ fixed/README.md
├─ mock/README.md
└─ docs/
   ├─ attack-steps.md
   ├─ fix-notes.md
   └─ manual-verification.md
```

脚本目录：

```text
tools/lab-scripts/web/xpath-injection/
├─ README.md
├─ exploit.py
└─ verify.ts
```

脚本边界：

- 默认只访问 `http://127.0.0.1:6667`。
- 只允许 localhost / 127.0.0.1 / ::1。
- 不访问外部目标。
- 不生成通用 payload 库。
- 不保存真实 token 或 Cookie。
- 不执行任意 XPath 表达式。
- 不读取真实 XML 文件。

## 12. 测试计划

后续实现至少补齐：

- `apps/server/tests/xpath-injection-lab.test.ts`
  - 漏洞版正常查询只返回公开匹配结果。
  - 漏洞版受控样例触发虚拟范围扩大信号。
  - 修复版同样样例返回阻断信号。
  - 事件日志只写入脱敏摘要。
- `apps/web/tests/xpath-injection-api.test.ts`
  - API 路径、variant 和请求体正确。
- `apps/web/tests/xpath-injection-lab.test.ts`
  - helper 能生成学习记录和验证记录。
- `apps/web/tests/router.test.ts`
  - 路由包含漏洞版 / 修复版入口。
- `packages/shared/tests/lab-metadata.test.mjs`
  - 目录切片阶段先校验 planned/docs-only 元数据。
  - ready 阶段再校验 web / api / scripts / docs / verification 入口齐全。

## 13. 验证命令

目录与文档切片完成后建议运行：

```powershell
pnpm --filter @network-safe/shared test
git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-xpath-injection-lab.md labs/web/xpath-injection tools/lab-scripts/web/xpath-injection packages/shared/tests/lab-metadata.test.mjs
rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-xpath-injection-lab.md labs/web/xpath-injection tools/lab-scripts/web/xpath-injection packages/shared/tests/lab-metadata.test.mjs
```

后续实现完成后建议运行：

```powershell
pnpm --filter @network-safe/server test -- tests/xpath-injection-lab.test.ts
pnpm --filter @network-safe/web exec vitest run tests/xpath-injection-api.test.ts tests/xpath-injection-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/xpath-injection/verify.ts
python -m py_compile tools/lab-scripts/web/xpath-injection/exploit.py
```

类型检查：

```powershell
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit
```

空白与安全关键词：

```powershell
git diff --check
rg -n "[ \t]+$" <本轮目标文件>
# 按本项目安全关键词列表检查危险 API、外部请求、文件读取和原始输入摘要暴露。
```

## 14. 完成判定

后续实现必须同时满足：

- `meta.json` 状态为 `ready`。
- 漏洞版 / 修复版页面可进入。
- 后端受控 API 可用。
- 漏洞版受控样例出现虚拟结果范围扩大信号。
- 修复版同样样例出现阻断信号。
- 正常关键词在修复版仍可查询。
- 事件日志写入脱敏摘要。
- 文档、脚本和测试入口齐全。
- Python 脚本只允许本机目标。
- 最小必要验证通过。
- TODO 和总纲同步下一步状态。

## 15. 下一步

下一步先进入 `web/xpath-injection` 目录、元数据和文档切片，再实现后端虚拟 XML 产品目录查询模拟器与受控 API。

## 16. 目录与文档切片结果

本轮已完成目录与文档切片：

- 新增 `labs/web/xpath-injection/meta.json`，当前状态为 `planned`，模式为 `simulation`。
- 当前只登记 docs 入口，不登记尚未实现的 web / api / scripts 入口。
- 新增 `README.md`、`vuln/README.md`、`fixed/README.md`、`mock/README.md`。
- 新增 `docs/attack-steps.md`、`docs/fix-notes.md`、`docs/manual-verification.md`。
- 新增 `tools/lab-scripts/web/xpath-injection/README.md`。
- 补充共享元数据测试，确认 XPath 当前只登记文档入口，不登记尚未实现的页面、接口或脚本入口。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，22 项测试通过。
- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-xpath-injection-lab.md labs/web/xpath-injection tools/lab-scripts/web/xpath-injection packages/shared/tests/lab-metadata.test.mjs` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-30-web-xpath-injection-lab.md labs/web/xpath-injection tools/lab-scripts/web/xpath-injection packages/shared/tests/lab-metadata.test.mjs` 未发现目标文件行尾空白。
- XPath 目录、脚本 README 与执行文档安全关键词扫描未命中危险 API、外部请求、文件读取或原始输入摘要暴露。
- XPath 安全边界扫描确认文档明确包含“不读取真实 XML 文件、不执行任意 XPath 表达式、不接入外部 XML 数据源、不访问外部目标”等约束。

下一步进入后端切片：实现虚拟 XML 产品目录查询模拟 service、受控 API 和服务端测试。

## 17. 后端切片结果

本轮已完成后端切片：

- 新增 `apps/server/src/services/xpath-injection-lab.ts`。
- 新增 `POST /api/labs/web/xpath-injection/:variant/search`。
- 漏洞版固定受控样例触发 `xpath-injection-result-scope-expanded`。
- 修复版同样样例触发 `xpath-injection-controlled-sample-blocked`。
- XPath 事件日志已接入 `lab_event_logs`，只写入脱敏摘要。
- `labs/web/xpath-injection/meta.json` 已更新为 `in-progress`，当前只登记后端 API 和 API 测试。
- XPath 场景 README 与手动验证说明已同步后端切片状态。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/xpath-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，147 项通过。
- `pnpm --filter @network-safe/shared test` 通过，22 项测试通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- XPath 后端切片安全关键词扫描仅命中测试中的本机 `fetch` 和既有 `readFileUploadVariantKey` 函数名；`apps/server/src/services/xpath-injection-lab.ts` 单独扫描未命中危险 API、文件读取、外部请求、XPath 执行器或原始输入摘要暴露。

下一步进入前端与脚本切片：补齐 API client、实验 helper、工作台页面、路由、脚本入口和对应测试。

## 18. 前端、脚本与 ready 收口结果

本轮已完成 XPath 注入实验前端、脚本、元数据、文档和测试切片，实验状态推进为 `ready`：

- 新增 `apps/web/src/api/xpath-injection-lab.ts`，接入 `POST /api/labs/web/xpath-injection/:variant/search`。
- 新增 `apps/web/src/labs/xpath-injection.ts`，提供漏洞版 / 修复版配置、正常样例、受控样例、学习进度和验证记录载荷。
- 新增 `apps/web/src/views/XpathInjectionLabView.vue`，提供 XML 产品目录查询工作台、受控样例填充、后端判定、学习信号、虚拟产品目录结果和日志摘要说明。
- 新增 `/labs/web/xpath-injection/vuln` 与 `/labs/web/xpath-injection/fixed` 路由。
- 新增 `tools/lab-scripts/web/xpath-injection/exploit.py` 与 `verify.ts`，脚本仅允许 localhost / 127.0.0.1 / ::1。
- 更新 `labs/web/xpath-injection/meta.json` 为 `ready`，补齐 web / api / scripts / docs / verification 入口。
- 更新实验 README、漏洞版 / 修复版 / mock 说明、攻击步骤、修复说明、手动验证文档和脚本目录说明。
- 前端页面只展示 `keywordPreview`、风险类别、学习信号和虚拟结果，不展示完整危险输入或原始 `inputSummaryJson`。
- 后端仍只使用内存虚拟 XML 产品目录查询模拟器，不读取真实 XML 文件，不执行任意 XPath 表达式，不接入外部 XML 数据源。
- 已清理 `python -m py_compile` 生成的 `tools/lab-scripts/web/xpath-injection/__pycache__`。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/xpath-injection-api.test.ts tests/xpath-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、7 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，22 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/xpath-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，147 项通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/xpath-injection/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/xpath-injection/exploit.py` 通过，生成的 `__pycache__` 已清理。
- 文档更新后目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 文档更新后目标文件行尾空白扫描未命中。
- 文档更新后 XPath service 安全关键词扫描零命中；全链路扫描仅命中文档中的禁止性说明、共享元数据测试的 `readFile` 和既有 `readFileUploadVariantKey` 函数名误报。
- 文档更新后 `tools/lab-scripts/web/xpath-injection/` 下未发现残留 `__pycache__`。

后续建议进入 `web/ldap-injection` 案例化执行文档，先锁定不连接真实 LDAP 服务、不保存目录凭据、不提供对外 LDAP 查询脚本的安全边界。
