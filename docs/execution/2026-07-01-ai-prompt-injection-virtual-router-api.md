# Prompt 注入后端确定性路由 API 执行文档

## 1. 目标

本轮目标是在 `ai/prompt-injection` planned 文档入口基础上，接入后端确定性提示词路由 API。

本轮只实现服务端受控 API、事件日志摘要、服务端测试、元数据和文档同步，不创建前端页面、数据库迁移、攻击脚本、只读验证脚本、外部 AI 调用或真实工具调用。

## 2. 范围

本轮新增：

- `apps/server/src/services/prompt-injection-lab.ts`
- `apps/server/tests/prompt-injection-lab.test.ts`
- `POST /api/labs/ai/prompt-injection/:variant/evaluate`

本轮同步：

- `apps/server/src/app.ts`
- `labs/ai/prompt-injection/meta.json`
- `labs/ai/prompt-injection/README.md`
- `labs/ai/prompt-injection/vuln/README.md`
- `labs/ai/prompt-injection/fixed/README.md`
- `labs/ai/prompt-injection/mock/README.md`
- `labs/ai/prompt-injection/docs/attack-steps.md`
- `labs/ai/prompt-injection/docs/fix-notes.md`
- `labs/ai/prompt-injection/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `apps/server/tests/health.test.ts`
- `apps/server/tests/lab-registry.test.ts`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`
- `docs/design/next-wave-security-labs.md`

## 3. 接口约束

接口固定为：

```text
POST /api/labs/ai/prompt-injection/:variant/evaluate
```

只读取以下请求字段：

| 字段 | 说明 |
|---|---|
| `scenarioKey` | 固定场景 key |
| `instructionSourceKey` | 固定外部内容来源 key |
| `defensePolicyKey` | 固定防御策略 key |

接口不得读取、执行、保存或返回以下字段：

- `prompt`
- `systemPrompt`
- `developerPrompt`
- `model`
- `apiKey`
- `toolSchema`
- `url`
- `target`
- 任意提示词正文
- 真实系统提示词
- 真实用户隐私
- 真实模型输出
- token、Cookie、凭据或外部目标

## 4. 实施步骤

1. 新增 `prompt-injection-lab` 服务，使用内存固定样例和枚举 key。
2. 服务层返回确定性 `scenario`、`routing`、`policyAudit`、`signal`、`decision`、`message` 和 `nextStep`。
3. 未知 `scenarioKey`、`instructionSourceKey` 或 `defensePolicyKey` 必须阻断，并使用 `blocked-scenario`、`blocked-source`、`blocked-policy` 等安全摘要，不能回显原始输入。
4. 漏洞版展示固定样例中指令边界混淆、检索隔离缺失或工具请求越界暴露的学习信号。
5. 修复版展示指令分层、检索隔离、工具允许列表和输出策略校验的阻断或安全化结果。
6. 在 `apps/server/src/app.ts` 接入路由、变体白名单、字段校验、当前用户读取和 `lab_event_logs` 写入。
7. 事件日志 `inputSummary` 只记录固定 key、输入摘要长度、风险类别、命中固定样例、策略状态和学习信号。
8. 更新元数据为 `in-progress`，登记 API 入口和 API 测试证据，仍不登记 web 或 scripts 入口。
9. 更新文档说明当前已有后端 API，仍无前端页面、脚本入口、外部 AI 或真实工具调用。
10. 更新共享元数据测试和服务端 registry / health 测试。

## 5. 实施建议

- 复用现有 DNS 劫持和端口扫描的服务模式：服务层只返回受控虚拟结果，路由层负责鉴权、状态码和日志。
- 复用统一事件日志服务，不新增日志表。
- API 响应中只展示固定教学摘要，不展示完整提示词、完整检索片段或可复用攻击文本。
- 修复版对默认风险样例返回 `403`，便于学习者观察防御阻断路径。
- 修复版允许固定安全样例返回 `200`，证明正常业务问答仍可用。

## 6. 潜在风险

- 如果接口接收任意提示词，实验会变成提示词攻击测试器。
- 如果响应写入完整危险提示词或绕过模板，会突破本项目学习边界。
- 如果日志保存完整提示词、检索片段或模型输出，可能泄露真实业务信息。
- 如果调用外部 AI 或真实工具，输出不可控且可能生成危险内容。
- 如果元数据登记前端或脚本入口，会误导学习者认为这些入口已经可用。

## 7. 优化方案

- 首版仅使用固定 key 和固定摘要，后续前端工作台再提供引导式选择器。
- 首版先覆盖 service / API 差异测试，后续再补前端 helper、页面测试和只读一致性验证。
- 事件日志保留 `signal` 与策略摘要，支持后续复盘卡片读取。
- 对未知 key 一律阻断并脱敏，避免字段兜底和原文回显。

## 8. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/server test -- tests/prompt-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/shared test`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- Prompt 注入安全关键词扫描，确认命中仅属于边界说明、字段名、路径、测试反向断言或学习信号，不存在外部 AI 调用、危险提示词正文、可复用绕过模板、真实工具执行或攻击脚本实现。

## 9. 本轮完成条件

- 后端 API 能返回漏洞版和修复版的确定性差异结果。
- 后端日志只记录安全摘要，并写入统一事件日志服务。
- 未知 key 不回显原始输入。
- 元数据与实际 API 入口一致。
- 文档明确当前仍无前端页面和脚本入口。
- 最小必要验证通过后再提交。
