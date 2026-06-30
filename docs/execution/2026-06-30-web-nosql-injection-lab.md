# NoSQL 注入实验实现执行文档

## 1. 目标

实现 `web/nosql-injection` NoSQL 注入学习实验前，先锁定业务包装、接口契约、安全边界、日志摘要、脚本边界和验证方式。

本实验目标是让学习者从攻击方视角观察：

- 用户输入如何改变结构化查询语义。
- 漏洞版为何会扩大查询范围。
- 修复版为何只允许服务端定义的查询模板。
- 日志如何记录攻击信号但不保存完整危险输入。

本实验不以提供真实 NoSQL 攻击能力为目标。

## 2. 范围

后续实现范围：

- `labs/web/nosql-injection/` 实验目录。
- `tools/lab-scripts/web/nosql-injection/` 本机受控脚本目录。
- 后端虚拟文档查询器 service。
- 后端受控 API。
- 前端 API client、实验 helper、工作台页面和路由入口。
- 元数据、文档、脚本和最小测试。

本轮执行文档不直接修改代码。

## 3. 业务包装

建议业务包装为“优惠券文档检索”。

学习者看到的是一个业务查询场景：

- 正常用户按关键词查询可用优惠券。
- 攻击方尝试让查询条件语义被扩大。
- 防御方把查询条件固定为服务端模板，并只接收普通关键词。

选择该包装的原因：

- 不需要新增真实数据库。
- 与已有 SQL 注入商品搜索实验容易形成对比。
- 可以用少量内存虚拟文档展示结果范围变化。
- 不涉及真实账号、密码、token 或权限数据。

## 4. 安全边界

后续实现必须遵守：

- 不引入 MongoDB、Redis、Elasticsearch 或其他 NoSQL 服务。
- 不连接外部数据库或外部目标。
- 不执行任意对象查询。
- 不实现通用 NoSQL 操作符执行器。
- 不使用 `eval`、`Function`、Node VM 或动态代码执行。
- 不读取真实本机文件。
- 不请求真实外部 URL。
- 不保存完整危险输入、完整查询结构、真实密码、真实 token、真实 Cookie 或外部目标信息。
- 所有攻击样例只面向 localhost / 127.0.0.1 / ::1 的本项目接口。

## 5. 建议接口契约

后续 API 建议为：

```text
POST /api/labs/web/nosql-injection/:variant/search
```

其中 `variant` 只能为：

- `vuln`
- `fixed`

建议请求体字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `queryMode` | `string` | 固定查询模式，初期只允许 `coupon-search` |
| `keyword` | `string` | 普通业务关键词 |
| `filterText` | `string` | 教学用筛选文本，只用于受控风险分类，不作为真实查询结构执行 |

字段约束：

- `queryMode` 必须走固定允许列表。
- `keyword` 只作为普通字符串参与虚拟文档匹配。
- `filterText` 只允许后端识别固定受控样例类别。
- 后端不得把 `filterText` 解析结果作为任意查询条件执行。

## 6. 后端设计

建议新增：

```text
apps/server/src/services/nosql-injection-lab.ts
```

service 负责：

- 维护内存虚拟优惠券文档集合。
- 识别正常关键词查询。
- 识别固定受控风险样例。
- 生成漏洞版和修复版不同判定。
- 返回学习信号和面向学习者的说明。
- 写入统一实验事件日志。

虚拟文档集合只保存教学数据，例如：

- 优惠券编号。
- 展示名称。
- 适用渠道。
- 风险标记。
- 是否为隐藏教学记录。

不得保存真实用户数据或真实业务敏感数据。

## 7. 漏洞版行为

漏洞版用于展示“用户输入影响查询语义”的风险。

建议行为：

- 正常关键词只返回匹配的公开优惠券。
- 固定受控风险样例触发“查询范围扩大”的虚拟结果。
- 返回隐藏教学记录时必须明确标记为虚拟演示结果。
- 日志记录检测到的风险类别和学习信号。

建议学习信号：

- `nosql-injection-safe-query-completed`
- `nosql-injection-operator-detected`
- `nosql-injection-query-expanded`

漏洞版不得：

- 支持任意 NoSQL 操作符。
- 支持任意 JSON 查询对象。
- 访问真实数据库。
- 返回真实敏感数据。

## 8. 修复版行为

修复版用于展示服务端查询模板和输入约束。

建议行为：

- 只接受 `queryMode: "coupon-search"`。
- 只把 `keyword` 当作普通字符串。
- 发现 `filterText` 中的受控风险样例时直接阻断。
- 对对象型、数组型、疑似操作符型输入返回阻断信号。
- 正常关键词仍可返回公开优惠券。

建议学习信号：

- `nosql-injection-safe-query-completed`
- `nosql-injection-operator-blocked`
- `nosql-injection-schema-blocked`

修复说明必须强调：

- 修复不是靠前端隐藏输入框。
- 修复点在服务端查询模板、字段允许列表和输入类型约束。
- 日志只记录摘要，不保存完整查询结构。

## 9. 事件日志设计

统一写入 `lab_event_logs`。

建议字段：

- `labKey`: `web.nosql-injection`
- `variantKey`: `vuln` / `fixed`
- `phase`: `attack` / `defense` / `normal`
- `actorPerspective`: `attacker` / `user` / `system`
- `eventType`: `validation`
- `decision`: `accepted` / `blocked` / `failed`
- `signal`: 学习信号
- `riskLevel`: `high`

`inputSummary` 建议只包含：

- `queryMode`
- `keywordLength`
- `filterTextLength`
- `detectedRiskTypes`
- `matchedControlledSample`
- `resultScope`

不得包含：

- 完整 `keyword`
- 完整 `filterText`
- 完整查询结构
- 真实账号或凭据
- 外部目标信息
- `inputSummaryJson` 的前端展示

## 10. 前端页面设计

建议新增：

```text
apps/web/src/views/NosqlInjectionLabView.vue
```

页面结构沿用已有注入实验工作台：

- 当前实验名称。
- 漏洞版 / 修复版视角。
- 正常业务查询按钮。
- 攻击方受控样例按钮。
- 当前请求摘要。
- 后端判定结果。
- 学习信号。
- 日志摘要说明。
- 下一步建议。

页面不展示完整危险输入，不提供通用 payload 库。

## 11. 文档与脚本

实验目录：

```text
labs/web/nosql-injection/
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
tools/lab-scripts/web/nosql-injection/
├─ README.md
├─ exploit.py
└─ verify.ts
```

脚本边界：

- 默认只访问 `http://127.0.0.1:6667`。
- 只允许 localhost / 127.0.0.1 / ::1。
- 不访问外部目标。
- 不生成通用攻击 payload 库。
- 不保存真实 token 或 Cookie。

## 12. 测试计划

后续实现至少补齐：

- `apps/server/tests/nosql-injection-lab.test.ts`
  - 漏洞版正常查询。
  - 漏洞版受控样例触发查询扩大信号。
  - 修复版同样样例返回阻断信号。
  - 事件日志只写入脱敏摘要。
- `apps/web/tests/nosql-injection-api.test.ts`
  - API 路径、variant 和请求体正确。
- `apps/web/tests/nosql-injection-lab.test.ts`
  - helper 能生成学习记录和验证记录。
- `apps/web/tests/router.test.ts`
  - 路由包含漏洞版 / 修复版入口。
- `packages/shared/tests/lab-metadata.test.mjs`
  - 元数据 web / api / scripts / docs / verification 入口齐全。

## 13. 验证命令

后续实现完成后建议运行：

```powershell
pnpm --filter @network-safe/server test -- tests/nosql-injection-lab.test.ts
pnpm --filter @network-safe/web exec vitest run tests/nosql-injection-api.test.ts tests/nosql-injection-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/nosql-injection/verify.ts
python -m py_compile tools/lab-scripts/web/nosql-injection/exploit.py
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
rg -n "mongodb|mongoose|eval\(|new Function|vm\.|child_process|readFile|createReadStream|http\.request|https\.request|process\.env|inputSummaryJson" <本轮目标文件>
```

## 14. 完成判定

后续实现必须同时满足：

- `meta.json` 状态为 `ready`。
- 漏洞版 / 修复版页面可进入。
- 后端受控 API 可用。
- 漏洞版受控样例出现查询扩大信号。
- 修复版同样样例出现阻断信号。
- 正常关键词在修复版仍可查询。
- 事件日志写入脱敏摘要。
- 文档、脚本和测试入口齐全。
- Python 脚本只允许本机目标。
- 最小必要验证通过。
- TODO 和总纲同步下一步状态。

## 15. 下一步

下一步进入 `web/nosql-injection` 前端 API/helper/page/router、脚本与测试切片。后端虚拟文档查询器与受控 API 已在后续执行结果中落地。

## 16. 目录与文档切片执行结果

本轮已完成第一段落地：

- 建立 `labs/web/nosql-injection/` 标准实验目录。
- 新增 `meta.json`，状态为 `planned`，只登记文档入口，不登记尚未实现的 web / api / scripts 入口。
- 新增 `README.md`、`vuln/README.md`、`fixed/README.md`、`mock/README.md`。
- 新增 `docs/attack-steps.md`、`docs/fix-notes.md`、`docs/manual-verification.md`。
- 新增 `tools/lab-scripts/web/nosql-injection/README.md`，说明脚本目录仍为规划态。
- 补充共享元数据测试，覆盖 NoSQL planned 元数据。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，20 项通过。
- 文档空白检查未发现目标文件行尾空白。
- `git diff --check` 未发现新增空白错误，仅有当前工作区既有 LF/CRLF 提示。

后端虚拟文档查询器与受控 API 已在后续切片落地，下一步调整为补齐前端页面、路由、脚本与测试。

## 17. 后端虚拟查询器与受控 API 切片执行结果

本轮已完成第二段落地：

- 新增 `apps/server/src/services/nosql-injection-lab.ts`，以内存虚拟优惠券文档集合演示查询范围扩大，不连接 MongoDB、Redis、Elasticsearch 或外部 NoSQL 服务。
- 新增 `POST /api/labs/web/nosql-injection/:variant/search`，请求体使用 `queryMode`、`keyword`、`filterText`。
- 漏洞版固定受控样例 `LAB_CONTROLLED_OPERATOR:include-hidden-coupons` 会返回 `nosql-injection-query-expanded`，展示虚拟隐藏教学记录进入结果范围。
- 修复版同样样例会返回 `nosql-injection-operator-blocked`，展示服务端查询模板和输入约束的阻断效果。
- 对象型、数组型或疑似操作符输入只做风险分类，不作为任意查询结构执行。
- 事件日志已接入 `lab_event_logs`，`inputSummary` 只保存查询模式、关键词长度与脱敏预览、筛选文本长度、风险类型、是否命中受控样例、结果范围、文档数量和学习信号。
- 更新 `labs/web/nosql-injection/meta.json` 为 `in-progress`，只登记已实现的后端 API，web / scripts 入口等待后续切片。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/nosql-injection-lab.test.ts` 通过；该脚本实际运行服务端全量测试，133 项通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- 后端切片目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 后端切片目标文件行尾空白扫描未命中。
- 安全关键词扫描仅命中 `readFileUploadVariantKey` 函数名误报，未发现 NoSQL 后端切片使用真实 NoSQL 连接、动态代码执行、文件读取、外部请求或 `inputSummaryJson` 暴露。

前端 API/helper/page/router、脚本与测试切片已在后续完成，`meta.json` 状态已推进到 `ready`。

## 18. 前端、脚本与 ready 收口执行结果

本轮已完成第三段落地：

- 新增 `apps/web/src/api/nosql-injection-lab.ts`，封装 NoSQL 注入实验 API client。
- 新增 `apps/web/src/labs/nosql-injection.ts`，维护漏洞版 / 修复版配置、固定正常样例、固定受控样例、学习进度和验证记录载荷。
- 新增 `apps/web/src/views/NosqlInjectionLabView.vue`，提供优惠券检索工作台、受控样例填充、后端判定、学习信号、风险摘要和虚拟文档结果展示。
- 新增 `/labs/web/nosql-injection/vuln` 与 `/labs/web/nosql-injection/fixed` 路由。
- 新增 `tools/lab-scripts/web/nosql-injection/exploit.py`，只允许 localhost / 127.0.0.1 / ::1 的本机目标。
- 新增 `tools/lab-scripts/web/nosql-injection/verify.ts`，输出本机验证计划，不发起外部请求。
- 更新 `labs/web/nosql-injection/meta.json` 为 `ready`，补齐 web / api / scripts / docs / verification 入口。
- 更新实验 README、漏洞版 / 修复版 / mock 说明、攻击步骤、修复说明、手动验证文档和脚本 README。
- 补齐前端 API/helper/router 测试、共享元数据测试和服务端 registry/health 状态断言。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/nosql-injection-api.test.ts tests/nosql-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、7 项测试通过。
- `pnpm --filter @network-safe/shared test` 通过，20 项通过。
- `pnpm --filter @network-safe/server test -- tests/nosql-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，133 项通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/nosql-injection/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/nosql-injection/exploit.py` 通过，生成的 `__pycache__` 已清理。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- 安全关键词扫描仅命中 `readFileUploadVariantKey` 函数名误报，未发现 NoSQL 链路使用真实 NoSQL 连接、动态代码执行、文件读取、外部请求或 `inputSummaryJson` 暴露。

下一步进入 `web/crlf-injection` 实现执行文档与安全边界规划。
