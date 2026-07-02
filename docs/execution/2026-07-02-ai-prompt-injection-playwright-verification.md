# Prompt 注入页面级 Playwright 验证执行文档

## 1. 目标

本轮目标是在 `ai/prompt-injection` 已具备前端固定样例工作台和后端确定性路由 API 的基础上，补齐页面级 Playwright 差异验证。

验证重点是确认学习者登录后可以在漏洞版页面观察固定检索资料导致的指令边界风险信号，在修复版页面观察同一固定样例被策略护栏阻断，并能继续观察固定文档问答的安全回答路径。

本轮不创建脚本入口，不新增 `exploit.py` 或 `verify.ts`，不调用外部 AI，不调用真实工具，不标记 `ready`。

## 2. 范围

本轮新增或修改：

- `packages/testing/tests/e2e/platform.spec.mjs`
- `labs/ai/prompt-injection/meta.json`
- `packages/shared/tests/lab-metadata.test.mjs`
- `labs/ai/prompt-injection/README.md`
- `labs/ai/prompt-injection/docs/manual-verification.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 操作步骤

1. 在 Playwright 平台用例中新增 Prompt 注入漏洞版 / 修复版页面差异验证。
2. 用例登录 `demo_user`，只访问本项目页面和本机后端代理。
3. 漏洞版进入 `/labs/ai/prompt-injection/vuln`，使用默认固定“客服知识库”与“固定检索资料摘要”组合观察路由结果。
4. 断言页面不出现文本框，不提供任意提示词正文、模型配置、URL、密钥、目标或真实工具参数输入。
5. 断言漏洞版出现 `prompt-injection-retrieval-poisoning-visible` 对应页面文案、`accepted` 决策、`confused` 指令优先级、`missing` 输出策略状态和“策略阻断：否”。
6. 修复版进入 `/labs/ai/prompt-injection/fixed`，使用默认固定“客服知识库”与“检索隔离”策略观察阻断结果。
7. 断言修复版出现 `prompt-injection-policy-guardrail-applied` 对应页面文案、`blocked` 决策、`isolated` 指令优先级、`blocked` 输出策略状态和“策略阻断：是”。
8. 在修复版点击固定“文档问答”快捷按钮，再次观察结果。
9. 断言修复版固定文档问答出现 `prompt-injection-safe-answer-returned` 对应页面文案、`accepted` 决策、`safe-reference` 风险类别和策略审计可见。
10. 更新元数据 Playwright 自动化证据和共享元数据测试。
11. 同步场景文档与主进度文档。

## 4. 实施建议

- 复用 DNS 劫持和端口扫描页面级验证的登录、固定按钮、状态面板和固定输入断言风格。
- 页面断言优先使用可见文案、状态面板、固定按钮和固定 `<select>` 行为。
- 不引入新的 Playwright 文件，继续放入 `packages/testing/tests/e2e/platform.spec.mjs`，保持平台级页面验证入口集中。
- 元数据只增加 `verification.automation.playwright`，`entrypoints.scripts` 继续保持空数组。
- 不把 `variants[].supportsAutomation` 理解为攻击脚本自动化；本轮仅表示页面 / API 差异可被自动化验证覆盖。

## 5. 潜在风险

- 若页面断言只检查标题，无法证明漏洞版与修复版差异，需要同时断言学习信号、后端决策、路由摘要和策略审计状态。
- 若用例加入任意提示词正文、模型配置、URL、密钥或目标输入，会突破当前固定样例边界。
- 若元数据登记脚本入口，会误导后续自动化认为脚本闭环已完成。
- 若本轮直接标记 `ready`，会跳过只读一致性验证或最终 ready 审计。

## 6. 优化方案

- 本轮先补页面级验证，后续再补只读一致性验证脚本。
- 通过 Playwright 断言 `getByRole("textbox")` 数量为 0，辅助确认页面未提供任意提示词输入。
- 通过断言 `instructionPriority`、`outputPolicyStatus`、`blockedByPolicy` 和正常文档问答信号，避免只用宽泛文案证明页面差异。

## 7. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/testing e2e -- --grep "Prompt 注入"`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec vitest run tests/prompt-injection-api.test.ts tests/prompt-injection-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/server test -- tests/prompt-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- Prompt 注入安全关键词扫描，确认本轮未新增外部 AI 调用、任意提示词输入器、危险提示词正文、可复用绕过模板、真实工具执行或攻击脚本实现。

## 8. 本轮完成条件

- Playwright 能覆盖漏洞版检索污染可见、修复版策略护栏阻断和修复版安全回答三条页面路径。
- 页面级验证确认没有文本输入框。
- 元数据登记 Playwright 自动化证据，scripts 入口仍为空。
- 文档说明当前仍不提供攻击脚本、任意提示词输入、外部 AI 调用或真实工具调用。
- 最小必要验证通过后再提交。
