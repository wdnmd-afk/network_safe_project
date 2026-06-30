# Web SSTI 实验实现执行文档

## 1. 目标

落地 `web/ssti` 服务端模板注入实验的完整实现方案，后续按本文档实现前端工作台、后端受控接口、元数据、实验文档、脚本和测试。

本实验用于学习“用户输入被模板引擎当作模板语法解释”会带来的风险，但必须使用教学用模板模拟器，不允许执行真实模板表达式或不可信代码。

## 2. 范围

后续实现范围：

- 更新 `labs/web/ssti/meta.json`，从占位状态补齐真实入口和验证信息。
- 新增 SSTI 实验后端 service。
- 在 `apps/server/src/app.ts` 中新增受控 API。
- 新增前端 API client、实验 helper 和工作台页面。
- 在前端路由中注册漏洞版 / 修复版入口。
- 补充实验 README、攻击步骤、修复说明和手动验证文档。
- 补充本机受控 `exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据最小必要测试。
- 同步 TODO 与主目标文档。

后续实现不包含：

- 不使用 `eval`。
- 不使用 `Function`。
- 不使用 Node VM 执行不可信代码。
- 不接入可访问运行时对象的真实危险模板引擎配置。
- 不读取真实服务器上下文、环境变量、文件系统、进程信息或网络资源。
- 不保存真实模板全文、真实表达式全文、真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。
- 不新增数据库迁移。

## 3. 已确认上下文

本轮实施前已确认：

- `docs/design/next-wave-web-injection-labs.md`
  - SSTI 是下一批 Web 注入类实验的第二项。
  - 必须使用教学用模板模拟器，避免真实代码执行。
  - 推荐业务包装为“通知模板预览”。
- `labs/web/ssti/meta.json`
  - 当前为 `planned` 占位状态。
  - 已有 `vuln` / `fixed` 变体和目录路径。
  - `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 尚为空。
- `tools/lab-scripts/web/ssti/README.md`
  - 当前为脚本占位目录。
  - 后续可补充 `exploit.py`、`verify.ts`、`samples/` 和 `artifacts/`。
- 已落地的 `web/command-injection`
  - 后端 service 位于 `apps/server/src/services/command-injection-lab.ts`。
  - 前端 API client 位于 `apps/web/src/api/command-injection-lab.ts`。
  - 前端实验 helper 位于 `apps/web/src/labs/command-injection.ts`。
  - 前端工作台页面位于 `apps/web/src/views/CommandInjectionLabView.vue`。
  - 脚本位于 `tools/lab-scripts/web/command-injection/`。
  - 文档位于 `labs/web/command-injection/docs/`。

## 4. 安全边界

SSTI 实验必须保持以下硬约束：

- 后端只实现教学用模板模拟器。
- 模拟器只识别固定受控表达式类别。
- 受控表达式结果必须来自硬编码教学映射，不能由 JavaScript 求值产生。
- 模板来源在修复版中由系统维护，用户只提供变量值。
- 未知表达式在修复版中必须被拒绝或原样转义。
- 不暴露运行时对象、服务器上下文、环境变量或真实调试对象。
- 事件日志只记录模板长度、变量名、表达式类别、是否命中受控样例和学习信号。
- 脚本默认只访问 `http://127.0.0.1:6667`。
- 脚本只允许 `localhost`、`127.0.0.1`、`::1`。

禁止出现：

- `eval`
- `Function`
- Node VM 执行不可信代码
- 真实危险模板引擎表达式执行
- 真实服务器上下文读取
- 真实文件读取
- 真实网络请求
- 通用 SSTI payload 库

如果实现中确实出现上述字符串，必须是文档或测试对“禁止项”的断言，不得作为运行逻辑。

## 5. 实验业务模型

业务包装：**通知模板预览**。

学习者看到的是一个运营通知预览页面，用于选择或编辑通知模板，并填写教学变量。漏洞版展示“模板文本被解释”的风险；修复版展示“系统模板 + 变量允许列表 + 转义”的防御方式。

建议固定模板：

- `shipping-notice`：发货通知。
- `security-reminder`：安全提醒。
- `invoice-ready`：发票就绪提醒。

建议允许变量：

```ts
type SstiTemplateVariables = {
  customerName: string;
  orderNo: string;
  noticeTitle: string;
};
```

建议请求体：

```ts
type SstiPreviewInput = {
  templateKey: "shipping-notice" | "security-reminder" | "invoice-ready";
  templateText?: string;
  variables: SstiTemplateVariables;
};
```

字段约束：

- `templateKey` 使用固定允许列表。
- `templateText` 只在漏洞版用于教学模拟；修复版应忽略或拒绝用户提供的模板文本。
- `variables` 只允许 `customerName`、`orderNo`、`noticeTitle`。
- 不允许通过多字段兜底猜测变量名。

受控正常样例：

```text
尊敬的 {{ customerName }}，您的订单 {{ orderNo }} 已进入处理流程。
```

受控 SSTI 样例：

```text
尊敬的 {{ customerName }}，调试结果：{{ 7 * 7 }}
```

受控上下文暴露样例：

```text
尊敬的 {{ customerName }}，上下文：{{ debugContext }}
```

说明：`{{ 7 * 7 }}` 和 `{{ debugContext }}` 只能由教学模拟器识别为固定样例，不得交给 JavaScript、Node VM 或真实模板引擎执行。

## 6. 后端实现计划

### 6.1 新增 service

新增文件：

```text
apps/server/src/services/ssti-lab.ts
```

建议类型：

```ts
export type SstiVariantKey = "vuln" | "fixed";

export type SstiTemplateKey =
  | "shipping-notice"
  | "security-reminder"
  | "invoice-ready";

export type SstiExpressionType =
  | "allowed-variable"
  | "controlled-math-expression"
  | "controlled-debug-context"
  | "unknown-expression";

export type SstiSignal =
  | "ssti-safe-template-rendered"
  | "ssti-expression-evaluated"
  | "ssti-template-context-exposed"
  | "ssti-expression-blocked"
  | "ssti-template-not-found";

export type SstiStatus = "ok" | "blocked" | "failed";
```

建议结果结构：

```ts
export type SstiPreviewResult = {
  status: SstiStatus;
  variantKey: SstiVariantKey;
  templateKey: string;
  renderedText: string;
  inspection: {
    templateLength: number;
    expressionCount: number;
    expressionTypes: SstiExpressionType[];
    matchedControlledSample: boolean;
    unknownExpressionCount: number;
    variableKeys: string[];
    acceptedVariableKeys: string[];
  };
  signal: SstiSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};
```

实现要求：

- 模板扫描只允许做字符串解析和固定表达式分类。
- `{{ customerName }}`、`{{ orderNo }}`、`{{ noticeTitle }}` 只能映射到已确认变量值。
- `{{ 7 * 7 }}` 的结果必须来自固定教学映射，例如返回 `49`。
- `{{ debugContext }}` 的结果必须来自虚拟教学上下文，例如返回“虚拟上下文：templateId、tenantId、debugMode”，不得读取真实运行时对象。
- 漏洞版命中固定受控样例时，返回表达式被解释的学习信号。
- 修复版遇到非允许变量表达式时，返回阻断或转义结果。
- 未知 `templateKey` 返回失败，不兜底猜模板。

### 6.2 新增 app 路由

修改文件：

```text
apps/server/src/app.ts
```

新增依赖注入：

- `SstiLabService`
- `SstiVariantKey`
- `createSstiLabService`

新增路由：

```text
POST /api/labs/web/ssti/:variant/preview
```

请求体：

```json
{
  "templateKey": "shipping-notice",
  "templateText": "尊敬的 {{ customerName }}，调试结果：{{ 7 * 7 }}",
  "variables": {
    "customerName": "演示用户",
    "orderNo": "ORDER-1001",
    "noticeTitle": "发货提醒"
  }
}
```

响应状态建议：

- `200`：正常预览或漏洞版受控表达式解释成功。
- `403`：修复版阻断非允许表达式。
- `400`：缺少必填字段或变量结构不合法。
- `404`：变体不存在或模板不存在。
- `401`：未登录。

### 6.3 事件日志

API 必须调用 `recordLabEventSafely`。

固定字段：

- `labKey`: `web.ssti`
- `variantKey`: `vuln` / `fixed`
- `method`: `POST`
- `path`: `/api/labs/web/ssti/:variant/preview`

阶段建议：

- 漏洞版命中受控表达式：`attack`
- 修复版阻断受控表达式：`defense`
- 正常模板预览：`normal`

风险等级建议：

- `ssti-template-context-exposed`: `critical`
- `ssti-expression-evaluated`: `high`
- `ssti-expression-blocked`: `medium`
- `ssti-safe-template-rendered`: `low`
- `ssti-template-not-found`: `low`

`inputSummary` 只允许包含：

```ts
{
  templateKey: string;
  templateLength: number;
  variableKeys: string[];
  expressionCount: number;
  expressionTypes: SstiExpressionType[];
  matchedControlledSample: boolean;
  unknownExpressionCount: number;
  signal: SstiSignal;
}
```

不得记录完整 `templateText`、完整表达式、完整变量值或渲染全文。

## 7. 前端实现计划

### 7.1 API client

新增文件：

```text
apps/web/src/api/ssti-lab.ts
```

新增方法：

```ts
submitSstiPreview(variantKey, token, input)
```

请求路径：

```text
/api/labs/web/ssti/${variantKey}/preview
```

### 7.2 实验 helper

新增文件：

```text
apps/web/src/labs/ssti.ts
```

建议包含：

- `normalSstiTemplateSample`
- `attackSstiMathTemplateSample`
- `attackSstiDebugTemplateSample`
- `normalSstiVariables`
- `getSstiVariantConfig`
- `createSstiLearningProgress`
- `createSstiVerificationRecord`
- `formatSstiSignal`

验证记录写入条件：

- 漏洞版出现 `ssti-expression-evaluated` 或 `ssti-template-context-exposed`。
- 修复版出现 `ssti-expression-blocked`。

### 7.3 工作台页面

新增文件：

```text
apps/web/src/views/SstiLabView.vue
```

页面应包含：

- 漏洞版 / 修复版切换。
- 固定通知模板选择。
- 漏洞版模板文本编辑区。
- 修复版系统模板说明。
- 变量输入区：客户名、订单号、通知标题。
- “填入正常模板”按钮。
- “填入受控表达式样例”按钮。
- “填入受控上下文样例”按钮。
- “预览通知”按钮。
- 后端决策、学习信号、表达式类别、是否命中受控样例。
- 渲染结果预览。
- 下一步建议。

页面不展示真实运行时对象、真实服务器上下文或通用 SSTI payload 库。

### 7.4 路由

修改文件：

```text
apps/web/src/router/routes.ts
```

新增：

```text
/labs/web/ssti/vuln
/labs/web/ssti/fixed
```

组件：

```text
SstiLabView.vue
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
labs/web/ssti/meta.json
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

- `ssti-safe-template-rendered`
- `ssti-expression-evaluated`
- `ssti-template-context-exposed`
- `ssti-expression-blocked`

状态只有在实现、文档、脚本和测试都完成后才能改为 `ready`。

### 8.2 实验文档

新增或更新：

```text
labs/web/ssti/README.md
labs/web/ssti/docs/attack-steps.md
labs/web/ssti/docs/fix-notes.md
labs/web/ssti/docs/manual-verification.md
labs/web/ssti/vuln/README.md
labs/web/ssti/fixed/README.md
labs/web/ssti/mock/README.md
```

文档必须强调：

- 这是教学用模板模拟器。
- 不执行真实模板表达式。
- 攻击步骤只用于本机受控实验。
- 修复版依赖系统维护模板、变量允许列表和输出转义。

## 9. 脚本实现计划

新增或更新：

```text
tools/lab-scripts/web/ssti/README.md
tools/lab-scripts/web/ssti/exploit.py
tools/lab-scripts/web/ssti/verify.ts
```

`exploit.py` 要求：

- 默认 `--base-url http://127.0.0.1:6667`。
- 只允许 `localhost`、`127.0.0.1`、`::1`。
- 支持 `--variant vuln|fixed`。
- 支持 `--sample normal|math|debug-context`。
- 只调用本项目 API。
- 不生成通用 SSTI payload 库。
- 不执行本机命令。
- 不读取本机文件。

`verify.ts` 要求：

- 输出验证计划，不执行外部请求。
- 包含漏洞版正常预览、漏洞版受控表达式、漏洞版受控上下文、修复版阻断样例。
- 声明本机受控边界。

## 10. 测试计划

### 10.1 服务端测试

新增：

```text
apps/server/tests/ssti-lab.test.ts
```

覆盖：

- service 正常模板返回 `ssti-safe-template-rendered`。
- service 漏洞版受控数学表达式返回 `ssti-expression-evaluated`。
- service 漏洞版受控上下文样例返回 `ssti-template-context-exposed`。
- service 修复版同样样例返回 `ssti-expression-blocked`。
- service 未知模板返回 `ssti-template-not-found`。
- API 未登录返回 401。
- API 漏洞版写入事件日志，日志 `inputSummary` 不包含完整 `templateText`。
- API 修复版阻断时返回 403 并写入 `defense` 事件。

### 10.2 前端测试

新增：

```text
apps/web/tests/ssti-api.test.ts
apps/web/tests/ssti-lab.test.ts
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

新增 SSTI 元数据断言：

- `status` 为 `ready`。
- web 入口为 `/labs/web/ssti/vuln` 和 `/labs/web/ssti/fixed`。
- API 入口为 `/api/labs/web/ssti/vuln/preview` 和 `/api/labs/web/ssti/fixed/preview`。
- `scriptVerification.scriptKeys` 包含 `ssti-verify`。

### 10.4 路由测试

更新：

```text
apps/web/tests/router.test.ts
```

确认 SSTI 漏洞版 / 修复版路由存在。

## 11. 最小验证命令

后续实现完成后优先运行：

```powershell
pnpm --filter @network-safe/server test -- tests/ssti-lab.test.ts
pnpm --filter @network-safe/web exec vitest run tests/ssti-api.test.ts tests/ssti-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ssti/verify.ts
python -m py_compile tools/lab-scripts/web/ssti/exploit.py
git diff --check
```

不默认运行 `pnpm build` 或全量打包。

## 12. 棘手问题处理

SSTI 在真实生产中可能导致任意代码执行、服务器上下文泄露或文件读取，因此本项目不做真实危险复现。

本项目采用以下安全化处理：

- 用教学用模板模拟器替代真实危险模板执行。
- 只识别固定受控表达式类别。
- 所谓表达式结果来自硬编码教学映射。
- 所谓上下文暴露只返回虚拟字段名，不返回真实对象。
- 修复版只允许系统模板和变量允许列表。
- 日志只记录脱敏摘要，不记录模板全文和表达式全文。

学习者应该观察：

- 漏洞版为什么会把表达式当作模板语法解释。
- 修复版为什么能阻断同样输入。
- 日志如何区分攻击尝试、正常预览和防御阻断。

真实生产还需要补充：

- 选择安全模板引擎配置。
- 禁止用户控制模板源。
- 对模板变量做允许列表校验。
- 对输出做上下文相关转义。
- 限制模板能力、沙箱和运行资源。
- 审计模板变更流程。

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

同时满足以下条件，才可将 `web.ssti` 从占位视为可用：

- `meta.json` 状态为 `ready`。
- 漏洞版与修复版页面可从详情页进入。
- 漏洞版受控数学表达式产生 `ssti-expression-evaluated`。
- 漏洞版受控上下文样例产生 `ssti-template-context-exposed`。
- 修复版同样样例产生 `ssti-expression-blocked`。
- 正常模板变量在修复版仍可渲染。
- 统一事件日志可在账号中心和详情页复盘。
- 日志不包含完整 `templateText`、完整表达式、完整变量值或任何真实敏感值。
- 脚本只能访问本机受控 API。
- 最小验证命令通过。
