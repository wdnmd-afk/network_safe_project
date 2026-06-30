# Web 命令注入实验实现执行文档

## 1. 目标

落地 `web/command-injection` 命令注入实验的完整实现方案，后续按本文档实现前端工作台、后端受控接口、元数据、文档、脚本和测试。

本实验用于学习“用户输入被拼入命令执行流程”会带来的风险，但必须使用虚拟命令运行器，不允许调用真实系统命令。

## 2. 范围

后续实现范围：

- 更新 `labs/web/command-injection/meta.json`，从占位状态补齐真实入口和验证信息。
- 新增命令注入实验后端 service。
- 在 `apps/server/src/app.ts` 中新增受控 API。
- 新增前端 API client、实验 helper 和工作台页面。
- 在前端路由中注册漏洞版 / 修复版入口。
- 补充实验 README、攻击步骤、修复说明和手动验证文档。
- 补充本机受控 `exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据最小必要测试。
- 同步 TODO 与主目标文档。

后续实现不包含：

- 不调用 `child_process`。
- 不调用真实 shell、PowerShell、`cmd.exe` 或系统命令。
- 不执行用户输入。
- 不扫描网络。
- 不访问外部目标。
- 不读取真实本机文件。
- 不保存真实命令全文、真实密码、真实 token、真实 Cookie、完整 payload 或外部目标信息。
- 不新增数据库迁移。

## 3. 已确认上下文

本轮实施前已确认：

- `docs/design/next-wave-web-injection-labs.md`
  - 命令注入是下一批 Web 注入类实验的第一项。
  - 必须使用虚拟命令运行器，不调用真实 shell 或系统命令。
- `labs/web/command-injection/meta.json`
  - 当前为 `planned` 占位状态。
  - 已有 `vuln` / `fixed` 变体和目录路径。
  - `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 尚为空。
- `apps/web/src/router/routes.ts`
  - 已有实验通过 `/labs/<category>/<scene>/<variant>` 注册工作台路由。
- 既有成熟实验模式：
  - 后端 service 位于 `apps/server/src/services/<scene>-lab.ts`。
  - 前端 API client 位于 `apps/web/src/api/<scene>-lab.ts`。
  - 前端实验 helper 位于 `apps/web/src/labs/<scene>.ts`。
  - 前端工作台页面位于 `apps/web/src/views/<Scene>LabView.vue`。
  - 脚本位于 `tools/lab-scripts/web/<scene>/`。
  - 文档位于 `labs/web/<scene>/docs/`。

## 4. 安全边界

命令注入实验必须保持以下硬约束：

- 后端只实现虚拟命令运行器。
- 虚拟命令运行器只处理内存中的固定任务和固定虚拟输出。
- 漏洞版只模拟“命令片段被解释”的结果。
- 修复版只接受允许列表任务 ID 和普通参数值。
- 所有危险样例都必须是项目内固定受控样例。
- 事件日志不保存完整输入。
- 脚本默认只访问 `http://127.0.0.1:6667`。
- 脚本只允许 `localhost`、`127.0.0.1`、`::1`。

禁止出现：

- `child_process`
- `exec`
- `execFile`
- `spawn`
- `spawnSync`
- `PowerShell`
- `cmd.exe`
- `bash`
- `sh`
- 任意真实系统命令执行

如果实现中确实出现上述字符串，必须是文档或测试对“禁止项”的断言，不得作为运行逻辑。

## 5. 实验业务模型

业务包装：**诊断任务运行器**。

学习者看到的是一个平台运维诊断页面，用于选择固定诊断任务并填写虚拟目标。

建议固定任务：

- `cache-status`：查看虚拟缓存节点状态。
- `queue-depth`：查看虚拟队列堆积。
- `release-health`：查看虚拟发布健康度。

建议输入字段：

```ts
type CommandInjectionRunInput = {
  taskKey: "cache-status" | "queue-depth" | "release-health";
  target: string;
};
```

受控攻击样例只用于观察虚拟解释信号，例如：

```text
storefront-cache && reveal-debug-note
```

说明：该样例只能由虚拟命令运行器识别，不能传给真实 shell。

## 6. 后端实现计划

### 6.1 新增 service

新增文件：

```text
apps/server/src/services/command-injection-lab.ts
```

建议类型：

```ts
export type CommandInjectionVariantKey = "vuln" | "fixed";

export type CommandInjectionSignal =
  | "command-injection-normal-task-completed"
  | "command-injection-command-separator-detected"
  | "command-injection-virtual-command-executed"
  | "command-injection-allowlist-blocked"
  | "command-injection-task-not-found";

export type CommandInjectionStatus = "ok" | "blocked" | "failed";
```

建议结果结构：

```ts
export type CommandInjectionResult = {
  status: CommandInjectionStatus;
  variantKey: CommandInjectionVariantKey;
  taskKey: string;
  target: string;
  inspection: {
    targetLength: number;
    containsCommandSeparator: boolean;
    detectedOperator: "none" | "semicolon" | "and" | "or" | "pipe" | "redirect";
    matchedControlledSample: boolean;
    allowedTask: boolean;
  };
  virtualSteps: Array<{
    label: string;
    output: string;
    injected: boolean;
  }>;
  signal: CommandInjectionSignal;
  decision: "accepted" | "blocked" | "failed";
  message: string;
  nextStep: string;
  blockedReason?: string;
};
```

实现要求：

- `target` 只能参与字符串检查和虚拟输出。
- 不得把 `target` 传入任何系统执行 API。
- 漏洞版检测到固定受控样例时，返回虚拟额外步骤。
- 修复版检测到分隔符、管道或重定向时，返回阻断。
- 未知 `taskKey` 返回失败，不兜底猜任务。

### 6.2 新增 app 路由

修改文件：

```text
apps/server/src/app.ts
```

新增依赖注入：

- `CommandInjectionLabService`
- `CommandInjectionVariantKey`
- `createCommandInjectionLabService`

新增路由：

```text
POST /api/labs/web/command-injection/:variant/run
```

请求体：

```json
{
  "taskKey": "cache-status",
  "target": "storefront-cache"
}
```

响应状态建议：

- `200`：正常或漏洞版虚拟执行成功。
- `403`：修复版阻断命令分隔符、管道或重定向。
- `400`：缺少必填字段。
- `404`：变体不存在或任务不存在。
- `401`：未登录。

### 6.3 事件日志

API 必须调用 `recordLabEventSafely`。

固定字段：

- `labKey`: `web.command-injection`
- `variantKey`: `vuln` / `fixed`
- `method`: `POST`
- `path`: `/api/labs/web/command-injection/:variant/run`

阶段建议：

- 漏洞版命中受控注入样例：`attack`
- 修复版阻断受控注入样例：`defense`
- 正常任务：`normal`

风险等级建议：

- `command-injection-virtual-command-executed`: `critical`
- `command-injection-command-separator-detected`: `high`
- `command-injection-allowlist-blocked`: `medium`
- `command-injection-normal-task-completed`: `low`

`inputSummary` 只允许包含：

```ts
{
  taskKey: string;
  targetLength: number;
  targetPreview: "normal-target" | "controlled-command-injection-sample" | "custom-input";
  containsCommandSeparator: boolean;
  detectedOperator: "none" | "semicolon" | "and" | "or" | "pipe" | "redirect";
  matchedControlledSample: boolean;
  signal: CommandInjectionSignal;
}
```

不得记录完整 `target`。

## 7. 前端实现计划

### 7.1 API client

新增文件：

```text
apps/web/src/api/command-injection-lab.ts
```

新增方法：

```ts
submitCommandInjectionRun(variantKey, token, input)
```

请求路径：

```text
/api/labs/web/command-injection/${variantKey}/run
```

### 7.2 实验 helper

新增文件：

```text
apps/web/src/labs/command-injection.ts
```

建议包含：

- `normalCommandInjectionSample`
- `attackCommandInjectionSample`
- `getCommandInjectionVariantConfig`
- `createCommandInjectionLearningProgress`
- `createCommandInjectionVerificationRecord`
- `formatCommandInjectionSignal`

验证记录写入条件：

- 漏洞版出现 `command-injection-virtual-command-executed`。
- 修复版出现 `command-injection-allowlist-blocked`。

### 7.3 工作台页面

新增文件：

```text
apps/web/src/views/CommandInjectionLabView.vue
```

页面应包含：

- 漏洞版 / 修复版切换。
- 固定诊断任务选择。
- 虚拟目标输入。
- “填入正常目标”按钮。
- “填入受控攻击样例”按钮。
- “运行诊断”按钮。
- 后端决策、学习信号、检测到的操作符、是否命中受控样例。
- 虚拟执行步骤列表。
- 下一步建议。

页面不展示“真实系统命令执行结果”，只展示虚拟诊断步骤。

### 7.4 路由

修改文件：

```text
apps/web/src/router/routes.ts
```

新增：

```text
/labs/web/command-injection/vuln
/labs/web/command-injection/fixed
```

组件：

```text
CommandInjectionLabView.vue
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
labs/web/command-injection/meta.json
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

- `command-injection-virtual-command-executed`
- `command-injection-allowlist-blocked`
- `command-injection-normal-task-completed`

状态只有在实现、文档、脚本和测试都完成后才能改为 `ready`。

### 8.2 实验文档

新增或更新：

```text
labs/web/command-injection/README.md
labs/web/command-injection/docs/attack-steps.md
labs/web/command-injection/docs/fix-notes.md
labs/web/command-injection/docs/manual-verification.md
labs/web/command-injection/vuln/README.md
labs/web/command-injection/fixed/README.md
labs/web/command-injection/mock/README.md
```

文档必须强调：

- 这是虚拟命令运行器。
- 不执行真实系统命令。
- 攻击步骤只用于本机受控实验。
- 修复版依赖允许列表任务 ID 和参数值隔离。

## 9. 脚本实现计划

新增或更新：

```text
tools/lab-scripts/web/command-injection/README.md
tools/lab-scripts/web/command-injection/exploit.py
tools/lab-scripts/web/command-injection/verify.ts
```

`exploit.py` 要求：

- 默认 `--base-url http://127.0.0.1:6667`。
- 只允许 `localhost`、`127.0.0.1`、`::1`。
- 支持 `--variant vuln|fixed`。
- 支持 `--sample attack|normal`。
- 只调用本项目 API。
- 不执行本机命令。

`verify.ts` 要求：

- 输出验证计划，不执行外部请求。
- 包含漏洞版正常任务、漏洞版受控样例、修复版阻断样例。
- 声明本机受控边界。

## 10. 测试计划

### 10.1 服务端测试

新增：

```text
apps/server/tests/command-injection-lab.test.ts
```

覆盖：

- service 正常任务返回 `command-injection-normal-task-completed`。
- service 漏洞版受控样例返回 `command-injection-virtual-command-executed`。
- service 修复版同样样例返回 `command-injection-allowlist-blocked`。
- service 未知任务返回 `command-injection-task-not-found`。
- API 未登录返回 401。
- API 漏洞版写入事件日志，日志 `inputSummary` 不包含完整 `target`。
- API 修复版阻断时返回 403 并写入 `defense` 事件。

### 10.2 前端测试

新增：

```text
apps/web/tests/command-injection-api.test.ts
apps/web/tests/command-injection-lab.test.ts
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

新增命令注入元数据断言：

- `status` 为 `ready`。
- web 入口为 `/labs/web/command-injection/vuln` 和 `/labs/web/command-injection/fixed`。
- API 入口为 `/api/labs/web/command-injection/vuln/run` 和 `/api/labs/web/command-injection/fixed/run`。
- `scriptVerification.scriptKeys` 包含 `command-injection-verify`。

### 10.4 路由测试

更新：

```text
apps/web/tests/router.test.ts
```

确认命令注入漏洞版 / 修复版路由存在。

## 11. 最小验证命令

后续实现完成后优先运行：

```powershell
pnpm --filter @network-safe/server test
pnpm --filter @network-safe/web exec vitest run tests/command-injection-api.test.ts tests/command-injection-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/shared test
git diff --check
```

不默认运行 `pnpm build` 或全量打包。

## 12. 实施顺序

1. 新增后端 service 和 service 测试。
2. 在 `app.ts` 接入 API、鉴权、日志和 API 测试。
3. 新增前端 API client、helper 和测试。
4. 新增工作台页面并注册路由。
5. 更新元数据、README、攻击步骤、修复说明和手动验证文档。
6. 新增本机受控脚本与验证配置。
7. 运行最小验证。
8. 同步 TODO 和主目标文档。

## 13. 完成判定

同时满足以下条件，才可将 `web.command-injection` 从占位视为可用：

- `meta.json` 状态为 `ready`。
- 漏洞版与修复版页面可从详情页进入。
- 漏洞版受控样例产生 `command-injection-virtual-command-executed`。
- 修复版同样样例产生 `command-injection-allowlist-blocked`。
- 正常任务在修复版仍可完成。
- 统一事件日志可在账号中心和详情页复盘。
- 日志不包含完整 `target` 或任何真实敏感值。
- 脚本只能访问本机受控 API。
- 最小验证命令通过。

