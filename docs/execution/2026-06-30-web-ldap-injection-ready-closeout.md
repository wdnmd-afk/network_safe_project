# 2026-06-30 LDAP 注入 case-study ready 收口执行文档

## 目标

将 `web/ldap-injection` 从 `in-progress` 收口到 `ready`，但不通过新增 LDAP 查询脚本、攻击脚本或真实目录服务连接来满足完成标准。

本轮的核心目标是建立并落实 case-study 例外收口标准：LDAP 注入实验可以在不提供 `exploit.py` 的情况下标记为 `ready`，前提是它已经具备页面差异、受控虚拟 API、事件日志、文档边界、只读验证脚本、Playwright 验证和安全禁止项的完整证据链。

## 范围

- 更新 `labs/web/ldap-injection/meta.json`，将状态调整为 `ready`，并保留 `mode: "case-study"`。
- 保持 `variants[].supportsAutomation` 为 `false`，明确它表示“不提供攻击脚本自动化”，不是没有验证能力。
- 更新 LDAP README、手动验证文档、注入类剩余规划、总目标文档和 TODO。
- 更新共享元数据测试、服务端 health / registry 测试和 LDAP 只读一致性验证脚本。

不在本轮范围内：

- 不新增 `exploit.py`。
- 不新增 LDAP 查询脚本。
- 不连接真实 LDAP / AD / OpenLDAP 服务。
- 不提供 LDAP 过滤器 payload 库。
- 不实现任意 LDAP 过滤器执行器。
- 不展示原始 `inputSummaryJson`、目录账号、DN、真实邮箱、真实手机号、凭据或外部目标。

## ready 收口标准

LDAP case-study 标记为 `ready` 必须同时满足以下条件：

1. 元数据为 `status: "ready"`、`mode: "case-study"`，并明确安全边界。
2. 漏洞版和修复版都有前端工作台入口。
3. 漏洞版和修复版都有受控虚拟目录 API 入口。
4. 漏洞版受控样例能展示 `ldap-injection-scope-expanded` 学习信号。
5. 修复版同样受控样例能展示 `ldap-injection-controlled-sample-blocked` 学习信号。
6. 后端事件日志只记录脱敏摘要，不保存原始输入、目录账号或真实目录信息。
7. Playwright 页面验证覆盖漏洞版扩大范围和修复版阻断差异。
8. 服务端 API 测试覆盖正常查询、漏洞版扩大范围、修复版阻断、未知场景拒绝和日志摘要。
9. 只读一致性验证脚本覆盖元数据、文档、安全边界和入口登记。
10. 文档明确禁止真实 LDAP 连接、目录命令、对外查询脚本、payload 库和任意过滤器执行器。
11. `variants[].supportsAutomation` 仍为 `false`，避免把页面/API/文档验证误标为攻击脚本自动化。

## 操作步骤

1. 将 LDAP 元数据状态改为 `ready`，补充前置条件和安全边界中关于 ready 例外标准的说明。
2. 更新共享元数据测试，使其断言 LDAP 为 `ready`，但仍保持 `case-study` 和 `supportsAutomation: false`。
3. 更新服务端 registry / health 测试中的 LDAP 状态断言。
4. 更新 LDAP 一致性验证脚本，使其校验 ready 状态和 case-study 例外边界。
5. 更新 LDAP README 与手动验证文档，说明当前 ready 不包含攻击脚本。
6. 更新注入类剩余规划、总目标文档和 TODO，记录收口依据。
7. 运行最小必要验证和安全边界扫描。

## 实施建议

- 只修改状态、文档和验证断言，不新增运行时攻击能力。
- 不改后端 LDAP API 行为，避免把收口标准和功能变更混在一起。
- 不把 `supportsAutomation` 改为 `true`，因为当前没有攻击脚本自动化。
- 对安全扫描命中的文档禁止性说明单独归类，避免误认为新增危险能力。

## 潜在风险分析

- 风险：`ready` 被误解为已经存在 LDAP 查询脚本。
  - 控制：README、手动验证、元数据前置条件和总目标文档都明确当前没有攻击脚本。
- 风险：后续维护者把 `supportsAutomation: false` 理解为缺少验证。
  - 控制：元数据继续登记 Playwright、API test 和只读一致性验证脚本。
- 风险：case-study 例外被滥用于其它实验。
  - 控制：总目标文档只允许在高风险或不适合真实复现的实验中使用，并要求完整证据链。

## 优化方案

- 后续可为 `case-study` ready 例外抽出共享元数据约束，避免每个实验手写规则。
- 后续可将 LDAP Playwright 用例拆到独立 spec，降低平台主 spec 体积。
- 若未来引入真实目录靶场，必须新开执行文档并重新评估安全边界，不得在当前 ready 标准上直接追加真实连接能力。

## 验证方式

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/ldap-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts`
- `pnpm --filter @network-safe/testing test`
- `pnpm --filter @network-safe/testing e2e -- --grep "LDAP"`
- `git diff --check -- <本轮变更文件>`
- `rg -n "[ \t]+$" <本轮变更文件>`
- 对 LDAP 相关文件执行安全关键词扫描，确认未新增真实目录连接、目录命令、动态执行、命令执行、外部请求、文件读取或原始日志摘要展示。

## 本轮验证记录

- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `pnpm --filter @network-safe/server test -- tests/ldap-injection-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts` 通过；当前服务端脚本实际运行全量测试，154 项通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "LDAP"` 通过，1 项 Playwright 测试通过。
- 首轮 shared / LDAP verify 曾暴露 `safeBoundaries` 缺少同时包含 `case-study` 与 `ready` 的证据，已补强元数据后重跑通过。
- 目标文件 `git diff --check` 未发现空白错误，仅有既有 LF/CRLF 提示。
- 目标文件行尾空白扫描未命中。
- LDAP 聚焦安全关键词扫描仅命中文档中的禁止性说明和共享元数据测试读取 fixture 的 `readFile`，未发现真实目录连接、目录命令、动态执行、命令执行、外部请求或 `inputSummaryJson` 暴露。
