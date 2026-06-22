# web/xss 完善执行文档

## 1. 目标

在现有 `web/xss` 客服留言样板实验基础上，补齐 XSS 相关内容，使其成为一期 Web 漏洞实验的完整样板：

- 页面可清晰对比漏洞版与修复版行为。
- 文档覆盖实验目标、攻击思路、修复思路、手动验证和安全边界。
- 元数据准确描述页面、文档、脚本和自动化验证入口。
- 自动化测试覆盖漏洞版 / 修复版差异与平台记录闭环。
- 脚本目录不再只是占位，提供本机受控验证说明和脚本入口。

本任务仍然保持本机受控教学边界，不扩展为通用攻击工具，不访问外部目标。

## 2. 范围

本次预计修改：

- `labs/web/xss/`
  - 更新 `meta.json` 自动化和脚本入口。
  - 扩充总 README、漏洞版 README、修复版 README、手动验证文档。
  - 新增攻击步骤与修复说明文档。
- `tools/lab-scripts/web/xss/`
  - 补充 README。
  - 新增 `verify.ts`，提供本机受控验证配置与断言描述。
- `packages/testing/tests/e2e/platform.spec.mjs`
  - 增加漏洞版 / 修复版差异断言。
- `packages/shared/tests/lab-metadata.test.mjs`
  - 增加 XSS 元数据自动化入口一致性测试。
- `docs/TODO.md`
  - 同步 XSS 当前状态与落点。

本次不修改：

- 数据库 schema 与迁移。
- 后端评论持久化接口。
- 真实脚本 payload、Cookie 读取、网络回连或外部目标访问逻辑。
- 非 XSS 场景的实现内容。

## 3. 当前依据

已确认现状：

- `apps/web/src/views/XssLabView.vue` 已有 `vuln` 与 `fixed` 两个变体。
- `apps/web/src/labs/xss.ts` 使用惰性 HTML 标记作为样例 payload。
- 漏洞版使用 HTML 渲染，修复版使用文本渲染。
- 平台记录接口已接入学习进度和验证记录。
- Playwright 已有登录到 XSS 修复版再到账户中心查看记录的闭环用例。

当前主要缺口：

- XSS 元数据仍未声明 Playwright 和脚本验证入口已启用。
- 脚本目录仍是占位说明。
- E2E 尚未单独覆盖漏洞版 / 修复版的页面差异。
- 文档缺少攻击步骤、修复说明和验证矩阵。

## 4. 操作步骤

1. 编写失败测试：
   - 共享包测试断言 XSS 元数据已启用 Playwright 和脚本验证，并包含 `xss-verify` 脚本入口。
   - Playwright 测试断言同一 payload 在漏洞版出现 `data-xss-lab-signal`，在修复版只作为文本显示。
2. 运行目标测试，确认新增测试失败。
3. 新增 `tools/lab-scripts/web/xss/verify.ts`：
   - 只导出本机验证配置、样例 payload 和预期信号。
   - 不发起外部请求，不提供攻击外部目标能力。
4. 更新 `tools/lab-scripts/web/xss/README.md`，说明脚本用途、运行边界和验证点。
5. 更新 `labs/web/xss/meta.json`：
   - 增加脚本入口。
   - 开启 Playwright 自动化路径。
   - 开启脚本验证并绑定脚本 key。
   - 视完成状态将 XSS 标记为 `ready`。
6. 扩充 XSS 文档：
   - 总 README 增加学习路径、验证矩阵、记录链路、自动化入口。
   - 漏洞版 README 增加风险解释与观察点。
   - 修复版 README 增加修复原则与边界。
   - 手动验证文档补充差异表与账户中心记录验证。
   - 新增 `docs/attack-steps.md` 和 `docs/fix-notes.md`。
7. 更新 TODO，将 XSS 状态从 `进行中` 调整为 `已完成`，并补充当前落点。
8. 运行最小必要验证。

## 5. 实施建议

- XSS payload 继续使用惰性标记：

```html
<mark data-xss-lab-signal="xss">XSS 模拟信号</mark>
```

- Playwright 只验证本机页面差异，不验证真实脚本执行。
- `verify.ts` 作为脚本验证资源入口，优先提供结构化验证配置，后续需要 CLI 化时再扩展。
- 所有文档继续强调该实验只面向本机受控学习环境。

## 6. 风险分析

- 漏洞版存在 `v-html`，必须限制在 `vuln` 变体并在文档中解释为受控教学行为。
- 若脚本文档措辞过强，容易被误解为通用攻击工具，因此脚本只描述本机页面验证。
- 如果把 XSS 状态标记为 `ready`，必须保证页面、文档、元数据、脚本入口和自动化测试都一致。
- 当前评论不持久化是有意边界，不应通过本任务扩大数据库范围。

## 7. 验证方式

最小验证：

```powershell
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/testing test
pnpm test:e2e
```

涉及前端模型或页面时追加：

```powershell
pnpm --filter @network-safe/web run test -- --run
pnpm --filter @network-safe/web exec vue-tsc --noEmit
```

本任务默认不执行 `pnpm build` 或全量打包。

## 8. 完成标准

- `labs/web/xss/meta.json` 与实际文档、脚本、Playwright 用例一致。
- `tools/lab-scripts/web/xss/verify.ts` 存在并保持本机受控验证边界。
- XSS 文档覆盖总览、漏洞版、修复版、攻击步骤、修复说明和手动验证。
- Playwright 覆盖漏洞版 / 修复版差异。
- 共享元数据测试覆盖 XSS 自动化入口。
- TODO 中 XSS 进度与落点准确。
- 最小必要验证通过。
