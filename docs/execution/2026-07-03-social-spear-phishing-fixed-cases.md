# 鱼叉式钓鱼固定案例文档执行文档

## 1. 目标

本轮目标是在 `social/spear-phishing` 已建立标准目录、基础文档和 `planned` 元数据的基础上，补齐固定虚构案例文档，让后续后端固定案例 API 和前端固定案例工作台有明确的案例边界。

本轮只补充文档、元数据 docs 入口和对应元数据测试断言，不实现页面、API、数据库写入、事件日志写入、`verify.ts`、`exploit.py`、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用或攻击脚本。

## 2. 范围

本轮新增：

- `labs/social/spear-phishing/docs/fixed-cases.md`

本轮同步：

- `labs/social/spear-phishing/meta.json`
- `labs/social/spear-phishing/README.md`
- `labs/social/spear-phishing/mock/README.md`
- `labs/social/spear-phishing/docs/attack-steps.md`
- `labs/social/spear-phishing/docs/manual-verification.md`
- `packages/shared/tests/lab-metadata.test.mjs`
- `docs/design/next-wave-security-labs.md`
- `docs/TODO.md`
- `docs/execution/security-lab-master-goal.md`

## 3. 操作步骤

1. 新增固定案例文档，定义四个固定虚构案例 key。
2. 每个案例只描述案例目标、虚构角色标签、误判线索、防御动作和学习信号。
3. 明确禁止完整邮件正文、IM 对话、可复制标题、可投递附件名、真实链接、跟踪链接、模板库、群发脚本和第三方平台调用。
4. 在 `meta.json` 的 `entrypoints.docs` 中登记 `fixed-cases` 文档入口，保持 `status: "planned"`、`mode: "case-study"`、web/api/scripts 入口为空。
5. 更新共享元数据测试，确认 docs 入口包含 `fixed-cases.md`。
6. 同步 README、mock 说明、攻击方观察步骤、手动验证和进度文档。
7. 执行最小必要验证和安全关键词扫描。

## 4. 实施建议

- 固定案例 key 使用当前已规划的四类：`executive-invoice-approval`、`vendor-payment-change`、`engineering-access-request`、`hr-benefit-personalized`。
- 虚构角色标签只使用泛化标签，例如“请求方标签”“审批链标签”“防御核验标签”，不写真实姓名、公司、邮箱、手机号、部门或职位。
- 案例内容必须保留攻击方视角，但只解释误判机制，不提供可投递素材。
- 防御动作必须覆盖角色核验、可信通道二次确认、审批链、最小授权、隔离举报和日志复盘。
- 本轮不改变 `verification.automation.supported`，也不改变 `variants[].supportsAutomation`。

## 5. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 固定案例写成完整话术 | 可能被误用为可投递模板 | 只写线索卡、风险标签和流程节点，不写正文、标题或对话 |
| 案例角色过于真实 | 可能引入隐私或骚扰风险 | 只使用虚构角色标签和业务链路标签 |
| 元数据误登记页面或 API | 平台会误以为场景已可运行 | 仅新增 docs 入口，web/api/scripts 保持空数组 |
| 文档弱化安全边界 | 后续实现可能偏离 case-study 约束 | 在 fixed-cases、README、manual-verification 和进度文档中同步禁止边界 |
| 测试断言未同步 | 元数据入口变化缺少回归保护 | 更新共享元数据测试 docs path 断言 |

## 6. 优化方案

- 后续后端 API 可以复用这些固定案例 key，但只能读取固定 key 和固定检查策略 key。
- 后续前端页面可以把 fixed-cases 作为案例卡内容来源的文档依据，但仍不得提供任意正文、邮箱、链接、附件或人员信息输入。
- 后续只读验证脚本可以检查 `fixed-cases.md` 存在、元数据 docs 入口同步、脚本目录不存在 `exploit.py`。

## 7. 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- `rg --files labs/social/spear-phishing tools/lab-scripts/social/spear-phishing`
- 安全关键词扫描，确认真实投递、画像采集、凭据收集、模板生成、第三方平台调用和攻击脚本相关命中均为禁止性说明、安全边界说明或测试反向断言。

## 8. 完成条件

- `fixed-cases.md` 存在且只包含固定虚构案例卡。
- `meta.json` docs 入口新增 `fixed-cases`，状态仍为 `planned`，web/api/scripts 仍为空数组。
- 共享元数据测试断言同步固定案例文档路径。
- 进度文档同步下一步指向后端固定案例 API 切片。
- 最小必要验证通过。

## 9. 本轮执行结果

本轮已完成固定案例文档切片：

- 新增 `labs/social/spear-phishing/docs/fixed-cases.md`，记录四个固定虚构案例卡。
- 更新 `labs/social/spear-phishing/meta.json`，新增 `fixed-cases` docs 入口。
- 同步 README、mock 说明、攻击方观察步骤和手动验证文档，明确固定案例只作为线索卡、风险标签、流程节点和复盘问题使用。
- 更新共享元数据测试，确认 docs path 包含 `labs/social/spear-phishing/docs/fixed-cases.md`。
- 同步 `docs/design/next-wave-security-labs.md`、`docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md`。
- 当前仍不提供页面、API、数据库写入、事件日志写入、`verify.ts`、`exploit.py`、真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用或攻击脚本能力。

验证记录：

- `pnpm --filter @network-safe/shared test` 通过，34 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts` 通过；该命令按当前服务端测试脚本实际运行全量服务端测试，203 项通过。
- `git diff --check -- <本轮目标文件>` 通过，仅保留 Windows 环境下 LF/CRLF 提示。
- `rg -n "[ \t]+$" -- <本轮目标文件>` 无命中。
- `rg --files labs/social/spear-phishing tools/lab-scripts/social/spear-phishing` 确认当前脚本目录只包含 README，场景目录只包含元数据和文档。
- 鱼叉式钓鱼安全关键词扫描命中均为禁止性说明、安全边界说明、测试断言或文档路径，未发现真实投递、画像采集、凭据收集、模板生成、第三方平台调用或攻击脚本实现。
