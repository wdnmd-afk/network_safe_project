# CRLF 注入实验实现执行文档

## 1. 目标

实现 `web/crlf-injection` 前，先锁定业务包装、接口契约、安全边界、日志摘要、脚本边界和验证方式。

本实验目标是让学习者从攻击方视角观察：

- CR / LF 控制字符进入响应头构造流程后为什么危险。
- 漏洞版为什么会出现“虚拟响应头被污染”的学习信号。
- 修复版为什么必须在服务端进行控制字符拒绝、字段白名单和上下文编码。
- 日志如何记录风险信号，但不保存完整危险输入。

本实验不以提供真实响应拆分或缓存投毒能力为目标。

## 2. 范围

后续实现范围：

- `labs/web/crlf-injection/` 实验目录。
- `tools/lab-scripts/web/crlf-injection/` 本机受控脚本目录。
- 后端虚拟响应头预览 service。
- 后端受控 API。
- 前端 API client、实验 helper、工作台页面和路由入口。
- 元数据、文档、脚本和最小测试。

本轮执行文档不直接修改代码。

## 3. 业务包装

建议业务包装为“下载响应头预览”。

学习者看到的是一个业务配置场景：

- 正常用户填写下载文件名或提示标题。
- 攻击方尝试把换行控制字符带入响应头构造流程。
- 漏洞版只在虚拟预览中展示头部结构被污染。
- 修复版在进入虚拟响应头构造器前阻断。

选择该包装的原因：

- 不需要真实下载、不需要代理、不需要缓存系统。
- 容易把 CRLF 风险映射到 `Content-Disposition` 这类常见头部。
- 可以用虚拟头部数组展示“正常头”和“被污染头”的差异。
- 便于统一事件日志记录脱敏摘要。

## 4. 安全边界

后续实现必须遵守：

- 不构造真实 HTTP 响应拆分。
- 不设置真实危险响应头。
- 不演示真实缓存投毒。
- 不演示真实 Cookie 注入。
- 不演示代理链路、浏览器缓存或网关影响。
- 不访问外部目标。
- 不读取真实本机文件。
- 不保存完整危险输入、完整 header 文本、真实 token、真实 Cookie 或外部目标信息。
- 所有攻击样例只面向 localhost / 127.0.0.1 / ::1 的本项目接口。

## 5. 建议接口契约

后续 API 建议为：

```text
POST /api/labs/web/crlf-injection/:variant/preview
```

其中 `variant` 只能为：

- `vuln`
- `fixed`

建议请求体字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `headerTemplate` | `string` | 固定头部模板，初期只允许 `download-filename` |
| `fileName` | `string` | 普通业务文件名 |
| `dispositionType` | `string` | 固定下载方式，初期只允许 `attachment` / `inline` |

字段约束：

- `headerTemplate` 必须走固定允许列表。
- `dispositionType` 必须走固定允许列表。
- `fileName` 只作为文本值进入虚拟预览。
- 漏洞版只识别固定受控 CRLF 样例，不支持通用 payload 库。
- 修复版发现 CR / LF 或控制字符时直接阻断。

建议固定受控样例：

```text
invoice.pdf\r\nX-Lab-Debug: exposed
```

该样例只能用于虚拟预览，不得写入真实响应头。

## 6. 后端设计

建议新增：

```text
apps/server/src/services/crlf-injection-lab.ts
```

service 负责：

- 维护固定响应头模板。
- 生成正常虚拟响应头预览。
- 识别固定受控 CRLF 样例。
- 生成漏洞版和修复版不同判定。
- 返回学习信号、虚拟头部预览和面向学习者的说明。
- 写入统一实验事件日志。

虚拟头部预览建议结构：

- `name`
- `valuePreview`
- `source`: `template` / `user-input` / `virtual-injected`
- `polluted`: `boolean`

不得返回完整危险 `fileName`；需要展示时只返回脱敏预览或固定学习标签。

## 7. 漏洞版行为

漏洞版用于展示“控制字符污染响应头结构”的风险。

建议行为：

- 正常文件名只生成一个 `Content-Disposition` 虚拟头部。
- 固定受控 CRLF 样例触发虚拟头部污染信号。
- 虚拟预览中可以出现 `X-Lab-Debug` 这类教学头部，但必须标记为 `virtual-injected`。
- 日志记录检测到的控制字符类别和学习信号。

建议学习信号：

- `crlf-injection-safe-header-previewed`
- `crlf-injection-control-chars-detected`
- `crlf-injection-virtual-header-injected`

漏洞版不得：

- 设置真实注入头。
- 拼接真实 HTTP 原始响应。
- 返回可直接复用于外部目标的 payload 库。
- 执行网络请求或代理请求。

## 8. 修复版行为

修复版用于展示服务端边界控制。

建议行为：

- 只接受固定 `headerTemplate`。
- 只接受固定 `dispositionType`。
- `fileName` 只作为文本值。
- 发现 CR、LF 或其他控制字符时阻断。
- 正常文件名仍可生成虚拟头部预览。

建议学习信号：

- `crlf-injection-safe-header-previewed`
- `crlf-injection-control-chars-blocked`
- `crlf-injection-template-not-found`

修复说明必须强调：

- 修复不是靠前端隐藏输入框。
- 修复点在服务端控制字符拒绝、模板化头部构造和上下文编码。
- 日志只记录摘要，不保存完整 header 或完整文件名。

## 9. 事件日志设计

统一写入 `lab_event_logs`。

建议字段：

- `labKey`: `web.crlf-injection`
- `variantKey`: `vuln` / `fixed`
- `phase`: `attack` / `defense` / `normal`
- `actorPerspective`: `attacker` / `user` / `system`
- `eventType`: `validation`
- `decision`: `accepted` / `blocked` / `failed`
- `signal`: 学习信号
- `riskLevel`: `high`

`inputSummary` 建议只包含：

- `headerTemplate`
- `dispositionType`
- `fileNameLength`
- `fileNamePreview`
- `detectedControlChars`
- `matchedControlledSample`
- `virtualHeaderCount`
- `pollutedHeaderCount`
- `signal`

不得包含：

- 完整 `fileName`
- 完整 header 文本
- 完整危险样例
- 真实 Cookie / token
- 外部目标信息
- 前端展示原始输入摘要 JSON

## 10. 前端页面设计

建议新增：

```text
apps/web/src/views/CrlfInjectionLabView.vue
```

页面沿用已有注入实验工作台：

- 当前实验名称。
- 漏洞版 / 修复版视角。
- 正常文件名样例按钮。
- 受控 CRLF 样例按钮。
- 当前请求摘要。
- 后端判定结果。
- 学习信号。
- 虚拟响应头预览。
- 日志摘要说明。
- 下一步建议。

页面不展示完整危险输入，不提供通用 payload 库，不暗示可以对外部站点复用。

## 11. 文档与脚本

实验目录：

```text
labs/web/crlf-injection/
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
tools/lab-scripts/web/crlf-injection/
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
- 不构造真实响应拆分。

## 12. 测试计划

后续实现至少补齐：

- `apps/server/tests/crlf-injection-lab.test.ts`
  - 漏洞版正常头部预览。
  - 漏洞版受控样例触发虚拟污染信号。
  - 修复版同样样例返回阻断信号。
  - 事件日志只写入脱敏摘要。
- `apps/web/tests/crlf-injection-api.test.ts`
  - API 路径、variant 和请求体正确。
- `apps/web/tests/crlf-injection-lab.test.ts`
  - helper 能生成学习记录和验证记录。
- `apps/web/tests/router.test.ts`
  - 路由包含漏洞版 / 修复版入口。
- `packages/shared/tests/lab-metadata.test.mjs`
  - 元数据 web / api / scripts / docs / verification 入口齐全。

## 13. 验证命令

后续实现完成后建议运行：

```powershell
pnpm --filter @network-safe/server test -- tests/crlf-injection-lab.test.ts
pnpm --filter @network-safe/web exec vitest run tests/crlf-injection-api.test.ts tests/crlf-injection-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/crlf-injection/verify.ts
python -m py_compile tools/lab-scripts/web/crlf-injection/exploit.py
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
- 漏洞版受控样例出现虚拟头部污染信号。
- 修复版同样样例出现阻断信号。
- 正常文件名在修复版仍可预览。
- 事件日志写入脱敏摘要。
- 文档、脚本和测试入口齐全。
- Python 脚本只允许本机目标。
- 最小必要验证通过。
- TODO 和总纲同步下一步状态。

## 15. 下一步

下一步可进入 `web/crlf-injection` 目录、元数据和文档切片，再实现后端虚拟响应头预览器与受控 API。

## 16. 目录与文档切片结果

本轮已完成目录与文档切片：

- 新增 `labs/web/crlf-injection/meta.json`，当前状态为 `planned`。
- 新增 `README.md`、`vuln/README.md`、`fixed/README.md`、`mock/README.md`。
- 新增 `docs/attack-steps.md`、`docs/fix-notes.md`、`docs/manual-verification.md`。
- 新增 `tools/lab-scripts/web/crlf-injection/README.md`。
- 补充共享元数据测试，确认 CRLF 当前只登记文档入口，不登记尚未实现的 web / api / scripts 入口。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，21 项测试通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有 `docs/TODO.md` 与 `packages/shared/tests/lab-metadata.test.mjs` 的既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- CRLF 目录、脚本 README 与本执行文档安全关键词扫描未命中危险 API、外部请求、文件读取或原始输入摘要暴露。

下一步进入后端切片：实现虚拟响应头预览 service、受控 API 和服务端测试。

## 17. 后端切片结果

本轮已完成后端切片：

- 新增 `apps/server/src/services/crlf-injection-lab.ts`。
- 新增 `POST /api/labs/web/crlf-injection/:variant/preview`。
- 漏洞版固定受控样例触发 `crlf-injection-virtual-header-injected`。
- 修复版同样样例触发 `crlf-injection-control-chars-blocked`。
- CRLF 事件日志已接入 `lab_event_logs`，只写入脱敏摘要。
- `labs/web/crlf-injection/meta.json` 已更新为 `in-progress`，当前只登记后端 API 和 API 测试。
- CRLF 场景文档已同步后端切片状态。

验证记录：

- `pnpm --filter @network-safe/server test -- tests/crlf-injection-lab.test.ts` 通过；该脚本实际运行服务端全量测试，140 项通过。
- `pnpm --filter @network-safe/shared test` 通过，21 项测试通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。

下一步进入前端与脚本切片：补齐 API client、实验 helper、工作台页面、路由、脚本入口和对应测试。

## 18. Ready 收口结果

本轮已完成前端、脚本、元数据、文档和测试收口：

- 新增 `apps/web/src/api/crlf-injection-lab.ts`。
- 新增 `apps/web/src/labs/crlf-injection.ts`。
- 新增 `apps/web/src/views/CrlfInjectionLabView.vue`。
- 新增 `/labs/web/crlf-injection/vuln` 与 `/labs/web/crlf-injection/fixed` 路由。
- 新增 `tools/lab-scripts/web/crlf-injection/exploit.py` 与 `verify.ts`。
- `labs/web/crlf-injection/meta.json` 已更新为 `ready`。
- CRLF 场景文档与脚本 README 已同步 ready 状态。

验证记录：

- `pnpm --filter @network-safe/web exec vitest run tests/crlf-injection-api.test.ts tests/crlf-injection-lab.test.ts tests/router.test.ts` 通过，3 个测试文件、7 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/crlf-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；该脚本实际运行服务端全量测试，140 项通过。
- `pnpm --filter @network-safe/shared test` 通过，21 项测试通过。
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit` 通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/crlf-injection/verify.ts` 通过并输出本机验证计划。
- `python -m py_compile tools/lab-scripts/web/crlf-injection/exploit.py` 通过，生成的 `__pycache__` 已清理。

下一步进入 `web/xpath-injection` 实现执行文档与目录切片。
