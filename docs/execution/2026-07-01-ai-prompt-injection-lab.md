# Prompt 注入实验执行文档

## 1. 目标

本轮目标是为 `ai/prompt-injection` 建立单独实现执行文档，承接 `network/dns-hijack` ready 收口之后的下一项 AI / 新型攻击实验。

本实验首版定位为“确定性提示词路由模拟器”，用于学习攻击方如何观察指令边界被外部内容干扰，以及防御方如何通过指令分层、检索隔离、工具允许列表和输出策略校验降低风险。

本轮只编写执行文档并同步规划状态，不创建实验目录、元数据、页面、API、数据库迁移或脚本。

## 2. 范围

后续实现范围建议包含：

- `labs/ai/prompt-injection/` 标准实验目录。
- `tools/lab-scripts/ai/prompt-injection/` 脚本目录占位或只读验证脚本。
- 固定场景样例、固定检索片段、固定用户意图和固定防御策略。
- 漏洞版 / 修复版两个变体。
- 后端受控 API，用于返回确定性路由结果、风险类别、策略判定和学习信号。
- 前端引导式工作台，用于选择固定样例并观察漏洞版与修复版差异。
- `lab_event_logs` 事件日志写入。
- 元数据、文档、手动验证和最小自动化测试。

本轮和首版实现均不包含：

- 不调用外部 AI、云模型、本地大模型或第三方推理接口。
- 不生成钓鱼文本、恶意代码、绕过策略、仿冒身份内容或可投递攻击素材。
- 不提供完整危险提示词、危险样例库、任意提示词执行器或可复用绕过模板。
- 不接收任意外部目标、真实系统提示词、真实业务密钥、真实用户隐私或真实模型输出。
- 不保存完整用户提示词、完整系统提示词、完整检索片段、token、Cookie、凭据或个人信息。
- 不提供 `exploit.py` 形式的 Prompt 注入攻击脚本。

## 3. 已确认上下文

- `docs/design/next-wave-security-labs.md`
  - `ai/prompt-injection` 是下一波首批推荐实验第三项。
  - 首版建议使用确定性提示词路由模拟器。
  - 日志只记录输入长度、风险类别、命中样例和学习信号。
- `docs/execution/security-lab-master-goal.md`
  - 后续实验必须先从攻击方视角设计学习路径，并提供修复版、防御验证、结构化日志和数据库事件日志。
  - 棘手问题必须写明安全模拟方式、刻意限制能力和学习者应观察的内容。
- `apps/server/src/services/lab-event-logs.ts`
  - 统一事件日志已支持 `attack` / `defense` / `normal` 阶段、`attacker` / `user` / `system` 视角和脱敏 `inputSummary`。
  - 服务层会对敏感 key 做脱敏，但本实验仍应从源头避免保存完整提示词。
- `apps/server/src/app.ts`
  - 现有实验采用 `POST /api/labs/<category>/<scene>/:variant/<action>` 风格，并在路由层读取当前用户、白名单化变体和必需字段。
- `apps/web/src/router/routes.ts`
  - 现有实验均使用 `/labs/<category>/<scene>/vuln` 与 `/labs/<category>/<scene>/fixed` 两个入口。
- `labs/network/dns-hijack/` 与 `tools/lab-scripts/network/dns-hijack/`
  - DNS 劫持已作为高风险主题受控模拟样板，采用固定样例、固定选择器、无真实外部请求和只读一致性验证脚本。

## 4. 实验设计

### 4.1 场景包装

建议场景名：

```text
Prompt 注入
```

建议业务包装：

- 虚拟“知识助手”读取固定检索片段并回答固定业务问题。
- 固定场景包括“客服知识库”“内部操作助手”“文档问答”三类。
- 学习者只选择固定 `scenarioKey`、固定 `instructionSourceKey` 和固定 `defensePolicyKey`。
- 页面展示“业务目标”“外部内容风险”“路由判定”“输出策略结果”四类观察点。

### 4.2 学习目标

- 理解攻击方为什么关注系统指令、检索内容、用户输入和工具调用之间的优先级。
- 理解外部内容如果被错误地当成高优先级指令，为什么会让输出偏离业务目标。
- 理解修复不是靠简单屏蔽关键词，而是靠指令分层、检索隔离、工具允许列表和输出策略校验。
- 理解日志应记录风险类别和学习信号，而不是保存完整敏感提示词。
- 理解本项目只使用确定性模拟结果，不调用真实 AI 生成内容。

### 4.3 变体设计

`vuln` 变体：

- 固定外部内容被错误提升为高优先级指令。
- 固定路由器将业务目标标记为被覆盖或偏离。
- 页面展示攻击方可观察信号：指令来源混淆、工具请求越界、输出策略缺失。
- 学习信号突出“外部内容覆盖业务意图”和“检索片段未隔离”。

`fixed` 变体：

- 同一固定样例经过指令分层和检索隔离后，不允许外部内容改变系统意图。
- 服务端只允许固定工具标签，不执行真实工具调用。
- 输出策略校验会把越界请求转为安全解释或阻断结果。
- 学习信号突出“工具请求被允许列表限制”和“输出策略校验生效”。

## 5. 攻击方视角

攻击方学习路径需要回答：

1. 攻击者的目标是让系统偏离原本业务目标或提升外部内容优先级。
2. 攻击者可观察的是固定外部内容、固定检索片段和固定用户意图之间的优先级变化。
3. 漏洞版为什么会把外部内容当成高优先级指令。
4. 攻击成功信号是什么，例如 `prompt-injection-instruction-overridden`、`prompt-injection-retrieval-poisoning-visible` 或 `prompt-injection-tool-request-exposed`。
5. 后端日志如何记录场景 key、输入长度、风险类别、命中固定样例和学习信号。
6. 同样样例在修复版为什么被隔离、阻断或转成安全回答。

攻击方视角只用于理解风险链路，不提供完整危险提示词、绕过模板、真实模型调用或外部目标利用方式。

## 6. 防御方视角

修复版学习路径需要回答：

1. 漏洞根因是指令优先级混淆、检索内容未隔离、工具调用缺少允许列表或输出策略缺失。
2. 修复点放在服务端提示词编排、检索内容隔离、工具允许列表、输出策略校验和日志审计。
3. 修复版如何识别外部内容不能覆盖系统意图。
4. 修复版如何保持正常业务问答可用。
5. 修复版日志与漏洞版日志有什么差异。
6. 自动化测试如何证明同一固定样例在漏洞版会暴露风险信号，在修复版会被阻断或安全化。

## 7. 确定性提示词路由模型

后续建议使用内存固定模型，不从用户输入拼接真实提示词，不调用任何 AI。

建议场景样例字段：

| 字段 | 说明 |
|---|---|
| `scenarioKey` | 固定场景标识，例如 `support-kb`、`tool-assistant`、`document-qa` |
| `title` | 面向学习者展示的场景名 |
| `businessGoal` | 固定业务目标摘要 |
| `instructionSourceKey` | 固定外部内容来源标识 |
| `expectedPolicy` | 期望策略，例如 `answer-within-scope`、`tool-allowlist-only` |
| `riskCategory` | 固定风险类别，例如 `instruction-override`、`retrieval-contamination`、`tool-overreach` |
| `learningNotes` | 面向学习者的风险说明 |

建议路由结果字段：

| 字段 | 说明 |
|---|---|
| `scenarioKey` | 固定场景标识 |
| `instructionSourceKey` | 固定外部内容来源标识 |
| `defensePolicyKey` | 固定防御策略标识 |
| `inputLength` | 输入摘要长度，不保存完整内容 |
| `riskCategory` | 固定风险类别 |
| `matchedControlledSample` | 是否命中固定样例 |
| `instructionPriority` | `confused` / `layered` / `isolated` |
| `toolRequestStatus` | `not-requested` / `requested` / `blocked` / `allowed-fixed-tool` |
| `outputPolicyStatus` | `missing` / `applied` / `blocked` |
| `learningHint` | 学习提示 |

约束：

- 不保存完整提示词。
- 不输出可复用攻击语句。
- 不调用真实模型或真实工具。
- 不接收任意系统提示词、模型配置、工具 schema、URL、密钥或外部目标。

## 8. 后端实现建议

后续建议新增：

```text
apps/server/src/services/prompt-injection-lab.ts
apps/server/tests/prompt-injection-lab.test.ts
```

建议 API：

```text
POST /api/labs/ai/prompt-injection/:variant/evaluate
```

请求字段建议：

| 字段 | 来源 | 说明 |
|---|---|---|
| `scenarioKey` | 前端固定选项 | 只能是服务端允许列表中的固定场景 |
| `instructionSourceKey` | 前端固定选项 | 只能是固定外部内容来源标签 |
| `defensePolicyKey` | 前端固定选项 | 只能是教学枚举，例如 `none`、`layered-instructions`、`retrieval-isolation`、`tool-allowlist` |

禁止请求字段：

- 不接收 `prompt`、`systemPrompt`、`developerPrompt`、`model`、`apiKey`、`toolSchema`、`url`、`target` 等真实执行字段。
- 不接收任意提示词正文。
- 不接收真实用户隐私、真实业务文档、token、Cookie、认证信息或模型输出。

后端响应建议：

| 字段 | 说明 |
|---|---|
| `status` | `ok` / `blocked` / `failed` |
| `decision` | `accepted` / `blocked` / `failed` |
| `signal` | 学习信号 |
| `message` | 面向学习者的说明 |
| `scenario` | 固定场景摘要 |
| `routing` | 确定性路由结果 |
| `policyAudit` | 指令分层、检索隔离、工具允许列表和输出校验摘要 |
| `safeAnswer` | 安全化教学回答，不包含危险内容 |
| `nextStep` | 下一步引导 |

建议学习信号：

- `prompt-injection-instruction-overridden`
- `prompt-injection-retrieval-poisoning-visible`
- `prompt-injection-tool-request-exposed`
- `prompt-injection-tool-request-blocked`
- `prompt-injection-policy-guardrail-applied`
- `prompt-injection-safe-answer-returned`
- `prompt-injection-boundary-verified`
- `prompt-injection-sample-blocked`

## 9. 事件日志设计

本实验继续写入 `lab_event_logs`，不新增数据库表。

建议日志映射：

| 场景 | `phase` | `eventType` | `actorPerspective` | `decision` | `riskLevel` |
|---|---|---|---|---|---|
| 漏洞版外部内容覆盖业务意图 | `attack` | `success` | `attacker` | `accepted` | `high` |
| 漏洞版工具请求越界暴露 | `attack` | `success` | `attacker` | `accepted` | `high` |
| 修复版工具请求被允许列表阻断 | `defense` | `blocked` | `attacker` | `blocked` | `medium` |
| 修复版输出策略校验生效 | `defense` | `success` | `system` | `blocked` | `medium` |
| 正常业务问答返回安全结果 | `normal` | `success` | `user` | `accepted` | `low` |

建议 `inputSummary` 只记录：

- `scenarioKey`
- `instructionSourceKey`
- `defensePolicyKey`
- `inputLength`
- `riskCategory`
- `matchedControlledSample`
- `instructionPriority`
- `toolRequestStatus`
- `outputPolicyStatus`
- `signal`

禁止记录：

- 完整系统提示词。
- 完整用户提示词。
- 完整检索片段。
- 真实模型输出。
- 真实工具参数。
- 真实 URL、密钥、Cookie、token、凭据或个人信息。

## 10. 前端实现建议

后续建议新增：

```text
apps/web/src/api/prompt-injection-lab.ts
apps/web/src/labs/prompt-injection.ts
apps/web/src/views/PromptInjectionLabView.vue
apps/web/tests/prompt-injection-api.test.ts
apps/web/tests/prompt-injection-lab.test.ts
```

建议页面结构：

- 变体标题：漏洞版 / 修复版。
- 当前视角：攻击方观察 / 防御方复盘。
- 安全边界提示：只展示确定性路由模拟，不调用外部 AI。
- 固定场景选择器。
- 固定外部内容来源选择器。
- 固定防御策略选择器。
- 一键提交观察按钮。
- 业务目标与路由结果对比。
- 指令分层、检索隔离、工具允许列表和输出策略面板。
- 后端决策、学习信号和下一步建议。
- 最近事件复盘卡片沿用现有详情页能力。

页面禁止：

- 不提供任意提示词输入框。
- 不提供真实模型名称、API Key、外部 URL 或工具执行参数输入框。
- 不展示可复制危险提示词、绕过模板、钓鱼文本、恶意代码或仿冒身份内容。
- 不使用“生成攻击内容”“绕过真实模型”“投递到外部系统”等措辞。

## 11. 目录与元数据建议

后续实验目录：

```text
labs/ai/prompt-injection/
├─ meta.json
├─ README.md
├─ vuln/
├─ fixed/
├─ mock/
└─ docs/
```

脚本目录：

```text
tools/lab-scripts/ai/prompt-injection/
```

首版元数据建议：

- `id`: `ai.prompt-injection`
- `slug`: `prompt-injection`
- `category`: `ai`
- `subcategory`: `prompt-injection`
- `mode`: `interactive`
- `status`: 目录和文档切片先用 `planned`，页面 / API 接入后用 `in-progress`，完成验证后再用 `ready`
- `variants`: `vuln` / `fixed`
- `entrypoints.docs`: 目录阶段先登记文档入口
- `entrypoints.web`: 页面完成后再登记
- `entrypoints.api`: API 完成后再登记
- `entrypoints.scripts`: 首版没有脚本时不登记攻击脚本

## 12. 脚本策略

首版不建议创建 `exploit.py`。

可选后续脚本：

- `verify.ts`：只读校验元数据、文档、固定场景样例和安全边界。

若后续创建脚本，必须满足：

- 默认只读取仓库内元数据、文档和实现文件。
- 不调用外部 AI、模型服务、浏览器自动化生成器或第三方 API。
- 不接收任意提示词、系统提示词、外部 URL、模型名、密钥或工具参数。
- 不生成钓鱼文本、恶意代码、绕过策略、仿冒身份内容或可投递素材。
- 输出本机受控学习信号，不输出可用于外部目标的真实攻击内容。

## 13. 文档要求

后续需要补齐：

- `labs/ai/prompt-injection/README.md`
- `labs/ai/prompt-injection/vuln/README.md`
- `labs/ai/prompt-injection/fixed/README.md`
- `labs/ai/prompt-injection/mock/README.md`
- `labs/ai/prompt-injection/docs/attack-steps.md`
- `labs/ai/prompt-injection/docs/fix-notes.md`
- `labs/ai/prompt-injection/docs/manual-verification.md`
- `tools/lab-scripts/ai/prompt-injection/README.md`

文档必须强调：

- 本实验是确定性路由模拟器，不是真实 AI 攻击工具。
- 攻击方视角用于理解指令边界风险，不用于对外目标。
- 防御方重点是指令分层、检索隔离、工具允许列表、输出策略校验和日志审计。
- 所有结果来自固定虚拟样例和固定规则。

## 14. 棘手问题与风险分析

- Prompt 注入真实复现容易变成可复用绕过教程；本项目不提供完整危险提示词，只使用固定标签、固定样例和确定性学习信号。
- 如果允许任意提示词输入，实验可能变成提示词攻击测试器；因此首版必须只允许固定 `scenarioKey`、`instructionSourceKey` 和 `defensePolicyKey`。
- 如果调用外部 AI 或真实工具，输出可能不可控并产生危险内容；因此首版不调用任何模型或工具，只返回受控教学结果。
- 如果保存完整提示词或检索片段，可能泄露真实业务信息；因此日志只保存长度、类别、样例 key 和学习信号。
- 如果修复版只返回失败页，学习者无法理解防御链路；修复版应展示指令分层、检索隔离、工具允许列表和输出策略如何共同生效。

## 15. 优化方案

- 首版使用内存固定规则，降低运行环境复杂度。
- 页面采用固定场景卡片和固定策略选择器，避免任意输入。
- 日志复用 `lab_event_logs`，不新增专用表。
- 复盘问题沿用现有通用生成逻辑，后续再考虑补充 AI 实验专属问题。
- 自动化优先覆盖 service / API 差异，再补前端 helper、Playwright 和只读一致性验证。

## 16. 验证方式

本轮是执行文档任务，最小验证为：

- 新增执行文档存在于 `docs/execution/`。
- `docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md` 同步本轮进展。
- `docs/design/next-wave-security-labs.md` 标记 `ai/prompt-injection` 已进入执行文档阶段。
- 目标文档通过行尾空白检查。
- 目标文档通过 `git diff --check`，若有既有 LF/CRLF 提示需记录。
- 安全关键词扫描只允许命中文档中的禁止性说明，不应出现外部 AI 调用、危险提示词正文、可复用绕过模板、真实工具执行或攻击脚本实现。

后续进入实现切片时，最小验证建议：

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/prompt-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/web exec vitest run tests/prompt-injection-api.test.ts tests/prompt-injection-lab.test.ts tests/router.test.ts`
- 若接入 Playwright，再运行 Prompt 注入聚焦用例。
- 若接入只读验证脚本，再运行 `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/ai/prompt-injection/verify.ts`。

## 17. 下一步建议

下一步建议进入 `ai/prompt-injection` 目录与元数据切片：

1. 创建 `labs/ai/prompt-injection/` 标准目录。
2. 创建 `planned` 状态 `meta.json`，只登记 docs 入口。
3. 创建 README、漏洞版说明、修复版说明、mock 说明、攻击方观察步骤、修复说明和手动验证文档。
4. 暂不创建后端 API、前端页面或 Prompt 注入脚本。
5. 运行共享元数据测试和文档安全扫描。
