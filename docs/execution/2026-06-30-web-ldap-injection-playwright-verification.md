# 2026-06-30 LDAP 注入 Playwright 页面验证执行文档

## 目标

为 `web/ldap-injection` 增加页面级端到端验证，确认前端虚拟目录工作台在真实浏览器流程中能够展示漏洞版与修复版的关键差异。

本轮只验证本项目 localhost 环境中的受控虚拟目录 API，不连接真实 LDAP、AD 或 OpenLDAP 服务，不新增 LDAP 查询脚本或攻击脚本。

## 范围

- 扩展 `packages/testing/tests/e2e/platform.spec.mjs`，新增 LDAP 工作台差异验证。
- 更新 `labs/web/ldap-injection/meta.json` 的 Playwright 验证登记。
- 更新共享元数据测试、只读一致性验证脚本、LDAP 场景文档、`docs/TODO.md` 与总目标文档。

不在本轮范围内：

- 不新增 `exploit.py`。
- 不改变后端 LDAP API 行为。
- 不把 LDAP 状态改为 `ready`。
- 不展示原始 `inputSummaryJson`、目录账号、真实过滤器或外部目标。

## 操作步骤

1. 复核现有 Playwright 配置和 `platform.spec.mjs` 登录 / 实验差异测试模式。
2. 新增 LDAP e2e 用例：
   - 登录 `demo_user`。
   - 进入 `/labs/web/ldap-injection/vuln`。
   - 填入受控样例并提交虚拟目录查询。
   - 断言漏洞版出现 `ldap-injection-scope-expanded` 对应中文学习信号，并展示虚拟受限教学记录。
   - 进入 `/labs/web/ldap-injection/fixed`。
   - 提交同样受控样例。
   - 断言修复版出现 `ldap-injection-controlled-sample-blocked` 对应中文学习信号，并展示 `blocked` 决策。
3. 在元数据中登记 Playwright 验证入口，但继续保持 `variants[].supportsAutomation` 为 `false`，因为本轮仍没有攻击脚本自动化。
4. 更新只读一致性验证脚本和共享元数据测试。
5. 同步文档与进度。
6. 运行最小必要验证。

## 实施建议

- e2e 测试只点击页面已有按钮，不在测试里构造新的 LDAP 过滤器或外部目标。
- 用页面可见文案断言学习信号，避免断言内部实现细节。
- 不增加新的账号、数据库字段或后端测试夹具。
- 如果 Playwright 运行环境已有服务在监听，应复用现有 smoke service 管理逻辑。

## 潜在风险分析

- Playwright 测试依赖本机 Chrome channel；若本机缺少对应浏览器，会导致环境失败而不是业务失败。
- 登录、种子数据或端口被占用会影响 e2e；本轮不改全局服务管理逻辑。
- 若把页面验证误解为攻击脚本自动化，会破坏 LDAP 的安全边界；因此元数据中变体自动化仍保持 `false`。

## 优化方案

- 后续可单独设计 LDAP 的 ready 例外收口标准，明确“不提供攻击脚本时”的完成判定。
- 后续可将注入类 e2e 用例拆分成独立 spec，降低 `platform.spec.mjs` 体积。

## 验证方式

- `pnpm --filter @network-safe/testing e2e -- --grep "LDAP"`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts`
- `git diff --check -- <本轮变更文件>`
- `rg -n "[ \t]+$" <本轮变更文件>`
- 对 LDAP 相关文件执行安全关键词扫描，确认未新增真实目录连接、目录命令、动态执行、命令执行、文件读取或原始日志摘要展示。

## 本轮验证记录

- `pnpm --filter @network-safe/testing test` 通过，9 项测试通过。
- `pnpm --filter @network-safe/testing e2e -- --grep "LDAP"` 通过，1 项 Playwright 测试通过。
- `pnpm --filter @network-safe/shared test` 通过，23 项测试通过。
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts` 通过，报告 `ok: true`。
- 首次 Playwright 运行暴露 testing smoke 仍期望旧实验总数 `15`，已改为从本地实验元数据动态统计。
- 后续 Playwright 运行暴露短文本状态断言匹配过宽，已收紧为状态面板内的决策和结果范围断言。
