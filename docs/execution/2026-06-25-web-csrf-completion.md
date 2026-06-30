# web/csrf 完整落地执行文档

## 1. 目标

在现有平台骨架、实验详情页、学习记录闭环和 `web/xss` 样板基础上，完整落地 `web/csrf` 实验，使其具备可运行的前端页面、后端受控业务接口、漏洞版 / 修复版对照行为、实验元数据、文档说明、验证脚本和自动化测试。

本实验仅面向本机受控学习环境，不生成可用于外部目标的攻击工具，不访问外部站点。

## 2. 范围

本次预计修改范围：

- `apps/server`
  - 新增 CSRF 受控实验服务。
  - 新增 CSRF 实验状态读取接口。
  - 新增漏洞版转账接口：不要求 CSRF token。
  - 新增修复版 token 颁发接口与转账接口：要求匹配 token。
  - 补充后端接口测试。
- `apps/web`
  - 新增 CSRF API client。
  - 新增 CSRF 实验业务模型。
  - 新增 `CsrfLabView.vue`。
  - 新增 `/labs/web/csrf/vuln` 与 `/labs/web/csrf/fixed` 路由。
  - 补充前端单元测试。
  - 补充样式。
- `labs/web/csrf`
  - 更新 `meta.json`。
  - 补充总 README、漏洞版 README、修复版 README、手动验证、攻击步骤、修复说明。
- `tools/lab-scripts/web/csrf`
  - 补充 README。
  - 新增 `exploit.py`，提供仅限 localhost 的受控请求模拟脚本。
  - 新增 `verify.ts`，导出本机受控验证配置和样例请求描述。
- `packages/shared`
  - 补充 CSRF 元数据测试。
- `packages/testing`
  - 补充 Playwright 端到端验证用例。
- `docs/TODO.md`
  - 同步 CSRF 当前状态与落点。

本次不修改：

- 数据库 schema。
- 外部网络访问逻辑。
- 通用攻击脚本或真实站点利用能力。
- 非 CSRF 场景业务实现。

## 3. 字段与接口来源

实验元数据字段来源：

- `packages/shared/src/lab-metadata.d.ts`
- `docs/design/lab-metadata-structure.md`
- 现有 `labs/web/xss/meta.json` 样板结构

后端实验接口字段本次显式定义：

- `variantKey`: `vuln` 或 `fixed`
- `amount`: 本机模拟转账金额，正整数
- `targetAccount`: 本机模拟收款账号，非空字符串
- `csrfToken`: 修复版接口要求的 token
- `status`: `idle`、`transferred`、`blocked`
- `lastSignal`: `csrf-transfer-accepted`、`csrf-token-required`、`csrf-token-accepted`

## 4. 实验设计

CSRF 场景模拟 SafeMart 账户中的“受信任支付设置 / 转账确认”业务。

漏洞版：

- 页面提供正常转账表单。
- 页面同时提供“模拟第三方页面自动提交”的受控触发按钮。
- 后端漏洞接口不校验 CSRF token，只要用户处于登录态并带有 Bearer token 即接受请求。
- 成功信号为 `csrf-transfer-accepted`。

修复版：

- 页面加载时向后端领取一次性 CSRF token。
- 正常转账必须携带 token。
- 受控模拟攻击请求不带 token，后端返回 `403`，不改变转账状态。
- 成功防护信号为 `csrf-token-required`；正常提交成功信号为 `csrf-token-accepted`。

学习记录：

- 进入任一变体时写入学习进度。
- 漏洞版模拟攻击成功或修复版模拟攻击被阻断时写入验证记录。
- 未登录时仍可查看页面说明，但业务请求提示需要登录。

## 5. 操作步骤

1. 先补失败测试：
   - 后端 CSRF 接口测试。
   - 前端 CSRF 业务模型测试。
   - 路由测试。
   - 元数据测试。
2. 实现后端 CSRF 服务和接口。
3. 实现前端 API client、业务模型和页面。
4. 更新路由、样式和详情页入口所需元数据。
5. 补充 `tools/lab-scripts/web/csrf/exploit.py` 和 `verify.ts`。
6. 补齐 CSRF 文档。
7. 更新 `docs/TODO.md`。
8. 运行最小必要验证。

## 6. 实施建议

- 后端使用内存态保存本机演示账户状态和 token，避免为单个实验扩展数据库 schema。
- token 仅用于本机教学演示，不声明为生产级实现。
- 漏洞触发按钮必须写明是“本机受控模拟”，不构造外部站点请求。
- 前端页面复用现有 `variant-switch`、`lab-note`、`form-panel` 和工作台布局。
- 记录接口失败不得阻断实验本身。

## 7. 风险分析

- 若脚本文档描述过泛，可能被误解为通用 CSRF 利用脚本；因此脚本只导出本项目本机路径、样例请求与预期信号。
- 漏洞版接口会故意缺少 CSRF token 校验，必须限制在 `/api/labs/web/csrf/vuln/*` 实验路径中。
- 修复版 token 若做成全局固定值，会削弱教学价值；应通过后端服务生成并缓存到本机内存态。
- 未登录状态下不能把业务请求伪装为成功，否则会误导实验结果。

## 8. 验证方式

最小必要验证：

```powershell
pnpm --filter @network-safe/server test
pnpm --filter @network-safe/web exec vitest run
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
```

补充验证：

```powershell
pnpm --filter @network-safe/testing exec node --test tests/*.test.mjs
pnpm test:e2e
```

本任务默认不执行全量 build。

## 9. 完成标准

- `web/csrf` 元数据状态更新为可运行，并提供漏洞版 / 修复版页面入口。
- 漏洞版接口可在登录态下不带 CSRF token 完成受控模拟转账。
- 修复版接口在缺少 token 时阻断请求，携带 token 时允许正常提交。
- 前端页面可展示状态、触发漏洞版模拟攻击、触发修复版阻断验证，并接入学习 / 验证记录。
- CSRF 文档、脚本入口、Playwright 用例和单元测试覆盖当前行为。
- 最小必要验证通过。
