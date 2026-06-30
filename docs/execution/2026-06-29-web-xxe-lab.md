# Web XXE 实验实现执行文档

## 1. 目标

落地 `web/xxe` XML 外部实体注入实验的完整实现方案，后续按本文档实现前端工作台、后端受控接口、元数据、实验文档、脚本和测试。

本实验用于学习“XML 解析器允许外部实体解析”可能带来的本地资源暴露或服务端请求风险，但必须使用虚拟 XML 资源解析器，不允许读取真实文件、不允许请求真实 URL、不允许解析真实外部实体。

## 2. 范围

后续实现范围：

- 更新 `labs/web/xxe/meta.json`，从占位状态补齐真实入口和验证信息。
- 新增 XXE 实验后端 service。
- 在 `apps/server/src/app.ts` 中新增受控 API。
- 新增前端 API client、实验 helper 和工作台页面。
- 在前端路由中注册漏洞版 / 修复版入口。
- 补充实验 README、攻击步骤、修复说明和手动验证文档。
- 补充本机受控 `exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据最小必要测试。
- 同步 TODO 与主目标文档。

后续实现不包含：

- 不接入真实 XML 外部实体解析能力。
- 不读取真实本机文件。
- 不请求真实外部 URL、内网 URL 或云元数据地址。
- 不返回真实环境变量、真实系统路径或真实文件内容。
- 不保存完整 XML 文档、完整实体声明、真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。
- 不新增数据库迁移。

## 3. 已确认上下文

本轮实施前已确认：

- `docs/design/next-wave-web-injection-labs.md`
  - XXE 是下一批 Web 注入类实验的第三项。
  - 必须使用虚拟 XML 资源解析，不读取真实本机文件、不请求真实外部 URL、不解析真实外部实体。
  - 推荐业务包装为“XML 发票 / 配置导入预览”。
- `labs/web/xxe/meta.json`
  - 当前为 `planned` 占位状态。
  - 已有 `vuln` / `fixed` 变体和目录路径。
  - `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 尚为空。
- `tools/lab-scripts/web/xxe/README.md`
  - 当前为脚本占位目录。
  - 后续可补充 `exploit.py`、`verify.ts`、`samples/` 和 `artifacts/`。
- 已落地的 `web/command-injection` 与 `web/ssti`
  - 后端 service 位于 `apps/server/src/services/<scene>-lab.ts`。
  - 前端 API client 位于 `apps/web/src/api/<scene>-lab.ts`。
  - 前端实验 helper 位于 `apps/web/src/labs/<scene>.ts`。
  - 前端工作台页面位于 `apps/web/src/views/<Scene>LabView.vue`。
  - 脚本位于 `tools/lab-scripts/web/<scene>/`。
  - 文档位于 `labs/web/<scene>/docs/`。

## 4. 安全边界

XXE 实验必须保持以下硬约束：

- 后端只实现虚拟 XML 资源解析器。
- 漏洞版只识别固定受控实体映射。
- `file:///virtual/...`、`virtual://internal/...` 等只作为教学标识，不映射到真实文件系统或真实网络。
- 未知实体必须拒绝，或作为普通文本处理。
- 修复版必须拒绝 DTD、外部实体声明或不可信实体引用。
- 事件日志只记录 XML 长度、是否包含 DOCTYPE、实体名、是否命中受控样例、风险类型和学习信号。
- 脚本默认只访问 `http://127.0.0.1:6667`。
- 脚本只允许 `localhost`、`127.0.0.1`、`::1`。

禁止出现：

- 真实本机文件读取
- 真实外部 URL 请求
- 真实内网探测或云元数据访问
- 真实外部实体解析
- 真实环境变量读取
- 真实系统路径内容返回
- 通用 XXE payload 库

如果实现中确实出现 `file://` 或类似 XML 实体样例，必须仅作为固定教学字符串使用，不得交给真实解析器或系统 I/O。

## 5. 实验业务模型

业务包装：**XML 发票 / 配置导入预览**。

学习者看到的是一个后台导入预览页面，用于上传或粘贴 XML 发票 / 配置片段并查看解析结果。漏洞版展示“外部实体被解析后暴露虚拟内部资源”的风险；修复版展示“禁用 DTD 与外部实体后，同样输入被阻断”的防御方式。

建议导入类型：

- `invoice-preview`：发票导入预览。
- `config-preview`：配置导入预览。

建议请求体：

```ts
type XxeImportInput = {
  importKind: "invoice-preview" | "config-preview";
  xmlDocument: string;
};
```

字段约束：

- `importKind` 使用固定允许列表。
- `xmlDocument` 必须限制长度，例如不超过 4000 字符。
- 不允许通过多字段兜底猜测 XML 内容字段。
- 后端只做字符串扫描、固定实体识别和受控字段抽取。

受控正常样例：

```xml
<invoice><customerName>演示用户</customerName><amount>128</amount></invoice>
```

受控 XXE 样例：

```xml
<!DOCTYPE invoice [<!ENTITY labSecret SYSTEM "file:///virtual/lab/internal-note">]>
<invoice><note>&labSecret;</note></invoice>
```

说明：`file:///virtual/lab/internal-note` 只是教学标识，永远不映射到真实文件系统。

## 6. 后端实现计划

### 6.1 新增 service

新增文件：

```text
apps/server/src/services/xxe-lab.ts
```

建议类型：

```ts
export type XxeVariantKey = "vuln" | "fixed";

export type XxeImportKind = "invoice-preview" | "config-preview";

export type XxeEntitySourceType =
  | "none"
  | "virtual-file"
  | "virtual-http"
  | "unknown";

export type XxeSignal =
  | "xxe-safe-xml-imported"
  | "xxe-virtual-entity-resolved"
  | "xxe-internal-resource-exposed"
  | "xxe-doctype-blocked"
  | "xxe-entity-not-found"
  | "xxe-import-kind-not-found";

export type XxeStatus = "ok" | "blocked" | "failed";
```

建议结果结构：

```ts
export type XxeImportResult = {
  status: XxeStatus;
  variantKey: XxeVariantKey;
  importKind: string;
  preview: {
    title: string;
    fields: Array<{
      key: string;
      label: string;
      value: string;
      fromVirtualEntity: boolean;
    }>;
  };
  inspection: {
    xmlLength: number;
    containsDoctype: boolean;
    declaredEntityNames: string[];
    referencedEntityNames: string[];
    entitySourceTypes: XxeEntitySourceType[];
    matchedControlledSample: boolean;
    unknownEntityCount: number;
  };
  signal: XxeSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};
```

实现要求：

- 虚拟解析器只能扫描字符串和固定结构，不调用真实外部实体解析。
- 漏洞版命中固定实体 `labSecret` 时，只返回硬编码教学内容，例如“虚拟内部说明：仅用于 XXE 学习复盘”。
- 漏洞版命中未知实体时，返回 `xxe-entity-not-found`，不得尝试读取文件或请求 URL。
- 修复版检测到 `DOCTYPE`、`<!ENTITY` 或外部实体引用时，返回 `xxe-doctype-blocked`。
- 正常 XML 在修复版仍可导入并返回 `xxe-safe-xml-imported`。
- 未知 `importKind` 返回失败，不兜底猜业务类型。

### 6.2 新增 app 路由

修改文件：

```text
apps/server/src/app.ts
```

新增依赖注入：

- `XxeLabService`
- `XxeVariantKey`
- `createXxeLabService`

新增路由：

```text
POST /api/labs/web/xxe/:variant/import
```

请求体：

```json
{
  "importKind": "invoice-preview",
  "xmlDocument": "<invoice><customerName>演示用户</customerName><amount>128</amount></invoice>"
}
```

响应状态建议：

- `200`：正常导入或漏洞版受控实体解析成功。
- `403`：修复版阻断 DTD / 外部实体。
- `400`：缺少必填字段、XML 长度超限或 XML 结构不符合教学要求。
- `404`：变体不存在或导入类型不存在。
- `401`：未登录。

### 6.3 事件日志

API 必须调用 `recordLabEventSafely`。

固定字段：

- `labKey`: `web.xxe`
- `variantKey`: `vuln` / `fixed`
- `method`: `POST`
- `path`: `/api/labs/web/xxe/:variant/import`

阶段建议：

- 漏洞版命中受控实体：`attack`
- 修复版阻断 DOCTYPE / 外部实体：`defense`
- 正常 XML 导入：`normal`

风险等级建议：

- `xxe-internal-resource-exposed`: `critical`
- `xxe-virtual-entity-resolved`: `high`
- `xxe-doctype-blocked`: `medium`
- `xxe-entity-not-found`: `medium`
- `xxe-safe-xml-imported`: `low`
- `xxe-import-kind-not-found`: `low`

`inputSummary` 只允许包含：

```ts
{
  importKind: string;
  xmlLength: number;
  containsDoctype: boolean;
  declaredEntityNames: string[];
  referencedEntityNames: string[];
  entitySourceTypes: XxeEntitySourceType[];
  matchedControlledSample: boolean;
  unknownEntityCount: number;
  signal: XxeSignal;
}
```

不得记录完整 `xmlDocument`、完整实体声明、虚拟资源内容或任何真实敏感值。

## 7. 前端实现计划

### 7.1 API client

新增文件：

```text
apps/web/src/api/xxe-lab.ts
```

新增方法：

```ts
submitXxeImport(variantKey, token, input)
```

请求路径：

```text
/api/labs/web/xxe/${variantKey}/import
```

### 7.2 实验 helper

新增文件：

```text
apps/web/src/labs/xxe.ts
```

建议包含：

- `normalXxeInvoiceSample`
- `attackXxeVirtualEntitySample`
- `getXxeVariantConfig`
- `createXxeLearningProgress`
- `createXxeVerificationRecord`
- `formatXxeSignal`

验证记录写入条件：

- 漏洞版出现 `xxe-virtual-entity-resolved` 或 `xxe-internal-resource-exposed`。
- 修复版出现 `xxe-doctype-blocked`。

### 7.3 工作台页面

新增文件：

```text
apps/web/src/views/XxeLabView.vue
```

页面应包含：

- 漏洞版 / 修复版切换。
- 导入类型选择。
- XML 文档输入区。
- “填入正常 XML”按钮。
- “填入受控 XXE 样例”按钮。
- “导入预览”按钮。
- 当前请求摘要：XML 长度、是否包含 DOCTYPE、实体名。
- 后端决策、学习信号、实体来源类型、是否命中受控样例。
- 导入预览结果。
- 下一步建议。

页面不展示真实文件内容、真实系统路径、真实环境变量、真实网络响应或通用 XXE payload 库。

### 7.4 路由

修改文件：

```text
apps/web/src/router/routes.ts
```

新增：

```text
/labs/web/xxe/vuln
/labs/web/xxe/fixed
```

组件：

```text
XxeLabView.vue
```

props：

```ts
{ variant: "vuln" }
{ variant: "fixed" }
```

## 8. 元数据与实验文档

### 8.1 元数据

更新：

```text
labs/web/xxe/meta.json
```

必须补齐：

- `summary`
- `knowledgePoints`
- `variants[].description`
- `variants[].expectedOutcome`
- `variants[].supportsAutomation`
- `entrypoints.web`
- `entrypoints.api`
- `entrypoints.scripts`
- `entrypoints.docs`
- `verification.manual.stepsDocPath`
- `verification.manual.expectedSignals`
- `verification.automation.apiTest`
- `verification.automation.scriptVerification`
- `prerequisites`
- `safeBoundaries`
- `sortOrder`
- `estimatedMinutes`

预期信号：

- `xxe-safe-xml-imported`
- `xxe-virtual-entity-resolved`
- `xxe-internal-resource-exposed`
- `xxe-doctype-blocked`
- `xxe-entity-not-found`

状态只有在实现、文档、脚本和测试都完成后才能改为 `ready`。

### 8.2 实验文档

新增或更新：

```text
labs/web/xxe/README.md
labs/web/xxe/docs/attack-steps.md
labs/web/xxe/docs/fix-notes.md
labs/web/xxe/docs/manual-verification.md
labs/web/xxe/vuln/README.md
labs/web/xxe/fixed/README.md
labs/web/xxe/mock/README.md
```

文档必须强调：

- 这是虚拟 XML 资源解析器。
- 不读取真实本机文件。
- 不请求真实外部 URL。
- 不解析真实外部实体。
- 攻击步骤只用于本机受控实验。
- 修复版依赖禁用 DTD、禁用外部实体、限制 XML 大小和只读取业务需要字段。

## 9. 脚本实现计划

新增或更新：

```text
tools/lab-scripts/web/xxe/README.md
tools/lab-scripts/web/xxe/exploit.py
tools/lab-scripts/web/xxe/verify.ts
```

`exploit.py` 要求：

- 默认 `--base-url http://127.0.0.1:6667`。
- 只允许 `localhost`、`127.0.0.1`、`::1`。
- 支持 `--variant vuln|fixed`。
- 支持 `--sample normal|virtual-entity`。
- 只调用本项目 API。
- 不读取本机文件。
- 不请求外部目标。
- 不生成通用 XXE payload 库。

`verify.ts` 要求：

- 输出验证计划，不执行外部请求。
- 包含漏洞版正常导入、漏洞版受控虚拟实体、修复版阻断样例。
- 声明本机受控边界。

## 10. 测试计划

### 10.1 服务端测试

新增：

```text
apps/server/tests/xxe-lab.test.ts
```

覆盖：

- service 正常 XML 返回 `xxe-safe-xml-imported`。
- service 漏洞版受控实体返回 `xxe-virtual-entity-resolved` 或 `xxe-internal-resource-exposed`。
- service 修复版同样 XML 返回 `xxe-doctype-blocked`。
- service 未知实体返回 `xxe-entity-not-found`，且不尝试文件或网络访问。
- service 未知导入类型返回 `xxe-import-kind-not-found`。
- API 未登录返回 401。
- API 漏洞版写入事件日志，日志 `inputSummary` 不包含完整 `xmlDocument`。
- API 修复版阻断时返回 403 并写入 `defense` 事件。

### 10.2 前端测试

新增：

```text
apps/web/tests/xxe-api.test.ts
apps/web/tests/xxe-lab.test.ts
```

覆盖：

- API client 请求路径、方法、鉴权头和 body。
- helper 生成学习进度与验证记录。
- signal 文案映射。

### 10.3 元数据测试

更新：

```text
packages/shared/tests/lab-metadata.test.mjs
```

新增 XXE 元数据断言：

- `status` 为 `ready`。
- web 入口为 `/labs/web/xxe/vuln` 和 `/labs/web/xxe/fixed`。
- API 入口为 `/api/labs/web/xxe/vuln/import` 和 `/api/labs/web/xxe/fixed/import`。
- `scriptVerification.scriptKeys` 包含 `xxe-verify`。

### 10.4 路由测试

更新：

```text
apps/web/tests/router.test.ts
```

确认 XXE 漏洞版 / 修复版路由存在。

## 11. 最小验证命令

后续实现完成后优先运行：

```powershell
pnpm --filter @network-safe/server test -- tests/xxe-lab.test.ts
pnpm --filter @network-safe/web exec vitest run tests/xxe-api.test.ts tests/xxe-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/xxe/verify.ts
python -m py_compile tools/lab-scripts/web/xxe/exploit.py
git diff --check
```

不默认运行 `pnpm build` 或全量打包。

## 12. 棘手问题处理

XXE 在真实生产中可能导致本地文件读取、服务端请求伪造、内网资源探测或敏感配置泄露，因此本项目不做真实危险复现。

本项目采用以下安全化处理：

- 用虚拟 XML 资源解析器替代真实外部实体解析。
- 只识别固定受控实体名和固定虚拟资源标识。
- 所谓内部资源内容来自硬编码教学映射。
- `file:///virtual/...` 仅用于说明攻击模型，不映射到真实路径。
- 修复版只展示 DTD / 外部实体阻断，不调用真实危险解析能力。
- 日志只记录脱敏摘要，不记录 XML 全文和实体声明全文。

学习者应该观察：

- 漏洞版为什么会把实体引用当作可解析资源。
- 修复版为什么能在解析前阻断同样输入。
- 日志如何区分攻击尝试、正常导入和防御阻断。

真实生产还需要补充：

- 使用安全 XML 解析器配置。
- 禁用 DTD 与外部实体。
- 限制 XML 大小、嵌套深度和解析耗时。
- 只读取业务需要字段。
- 对导入链路做审计、告警和异常样本留存策略。

## 13. 实施顺序

1. 新增后端 service 和 service 测试。
2. 在 `app.ts` 接入 API、鉴权、日志和 API 测试。
3. 新增前端 API client、helper 和测试。
4. 新增工作台页面并注册路由。
5. 更新元数据、README、攻击步骤、修复说明和手动验证文档。
6. 新增本机受控脚本与验证配置。
7. 运行最小验证。
8. 同步 TODO 和主目标文档。

## 14. 完成判定

同时满足以下条件，才可将 `web.xxe` 从占位视为可用：

- `meta.json` 状态为 `ready`。
- 漏洞版与修复版页面可从详情页进入。
- 漏洞版受控实体产生 `xxe-virtual-entity-resolved` 或 `xxe-internal-resource-exposed`。
- 修复版同样 XML 产生 `xxe-doctype-blocked`。
- 正常 XML 在修复版仍可导入。
- 统一事件日志可在账号中心和详情页复盘。
- 日志不包含完整 `xmlDocument`、完整实体声明、虚拟资源内容或任何真实敏感值。
- 脚本只能访问本机受控 API。
- 最小验证命令通过。
