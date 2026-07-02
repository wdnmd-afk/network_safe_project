# 依赖混淆手动验证

## 1. 当前 in-progress 页面与 API 验证

当前验证目录、文档、元数据入口、前端固定选择器工作台和后端受控 API，不验证脚本。

应确认：

- `labs/supply-chain/dependency-confusion/meta.json` 存在。
- `status` 为 `in-progress`。
- `mode` 为 `simulation`。
- `entrypoints.docs` 只登记真实存在的文档入口。
- `entrypoints.web` 登记漏洞版 / 修复版页面入口。
- `entrypoints.api` 登记漏洞版 / 修复版 `resolve` 接口。
- `entrypoints.scripts` 为空数组。
- `verification.automation.supported` 为 `true`，当前证据来自服务端 API 测试和 Playwright 页面级差异验证。
- `verification.automation.playwright.enabled` 为 `true`，`specPath` 指向 `packages/testing/tests/e2e/platform.spec.mjs`。
- `variants[].supportsAutomation` 均为 `false`。
- `tools/lab-scripts/supply-chain/dependency-confusion/README.md` 存在。
- 当前不存在 `exploit.py` 或 `verify.ts`。

API 手动观察可使用固定请求体：

```json
{
  "manifestKey": "unscoped-internal-name",
  "registryScenarioKey": "public-name-collision",
  "resolutionPolicyKey": "prefer-public-latest"
}
```

当前只允许固定 key，不允许传入真实包名、真实 registry URL、真实 lockfile 或凭据。

页面手动观察入口：

```text
/labs/supply-chain/dependency-confusion/vuln
/labs/supply-chain/dependency-confusion/fixed
```

页面应只展示固定 manifest、固定伪 registry 场景和固定解析策略选择器，不应出现任意包名、真实 registry URL、`.npmrc`、token、lockfile、安装命令或发布命令输入框。

Playwright 页面级验证应覆盖：

- 漏洞版点击“未绑定 scope”后，观察 `dependency-confusion-public-source-selected` 对应页面信号、`accepted` 决策、`public-registry` 来源、`untrusted` 信任状态、`missing` scope 状态和 `missing` lockfile 状态。
- 修复版点击“私有 scope”后，观察 `dependency-confusion-private-scope-pinned` 对应页面信号、`accepted` 决策、`private-registry` 来源、`trusted` 信任状态、`pinned` scope 状态和 `verified` lockfile 状态。
- 修复版点击“完整性审计”后，观察 `dependency-confusion-lockfile-integrity-blocked` 对应页面信号、`blocked` 决策、`blocked-audit` 来源、`blocked` 信任状态和 `mismatch` lockfile 状态。
- 修复版点击“混合来源”后，观察 `dependency-confusion-safe-public-package-accepted` 对应页面信号、`accepted` 决策、`mixed-audited` 来源和 `audited` 信任状态。
- 漏洞版和修复版页面都不应出现文本输入框。

## 2. 安全边界验证

应确认文档明确禁止：

- 真实依赖安装、登录、下载、打包或发布命令。
- 真实 registry、镜像源或私有包服务连接。
- 真实投毒包、包归档、发布脚本或生命周期脚本。
- `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token、CI 凭据或真实依赖缓存读取。
- 完整 manifest、真实包名清单、真实 registry 地址、凭据、内部组织名或本机路径保存。

## 3. 当前 API 验证预期

当前页面与 API 切片至少应验证：

- 漏洞版固定样例能观察错误来源选择。
- 修复版固定样例能观察 scope 绑定、来源审计或 lockfile 完整性阻断。
- 正常公开依赖样例仍可被接受。
- 未知 key 不回显、不读取真实配置、不连接真实 registry。
- 前端请求体只包含 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`。
- 事件日志只保存固定 key、来源类别、风险标签、审计动作和学习信号。

## 4. 当前最小验证命令

```text
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/testing test
pnpm --filter @network-safe/testing e2e -- --grep "依赖混淆"
pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts
pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit
pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts
```

并配合：

```text
git diff --check
rg -n "[ \t]+$" -- <本轮目标文件>
rg --files tools/lab-scripts/supply-chain/dependency-confusion labs/supply-chain/dependency-confusion
```

## 5. 禁止误判

当前 in-progress 阶段不能因为前端工作台、后端 API 和页面级验证存在就标记为 ready。只有后续补齐只读验证脚本，并完成收口审计后，才能考虑推进状态。
