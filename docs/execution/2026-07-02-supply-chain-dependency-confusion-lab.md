# 依赖混淆实验执行文档

## 1. 目标

本轮目标是为供应链实验 `supply-chain/dependency-confusion` 编写单独实现执行文档，承接网络钓鱼识别 ready 收口之后的下一项扩展实验。

本实验首版定位为“依赖解析风险观察器”：学习者通过固定 `package.json` 片段、固定伪 registry 元数据和固定解析策略，观察攻击方为什么会关注私有包名与公共包名冲突，以及防御方如何通过 scope、私有 registry 绑定、lockfile、完整性校验和安装源审计降低风险。

本轮只编写执行文档并同步规划状态，不创建实验目录、元数据、页面、API、数据库迁移、依赖包或脚本。

## 2. 范围

本轮只新增执行文档：

- `docs/execution/2026-07-02-supply-chain-dependency-confusion-lab.md`

后续实现范围建议包含：

- `labs/supply-chain/dependency-confusion/` 标准实验目录。
- `tools/lab-scripts/supply-chain/dependency-confusion/` 脚本目录占位或只读验证脚本。
- 固定 manifest 片段、固定伪 registry 元数据、固定解析策略和固定审计结果。
- 漏洞版 / 修复版两个变体。
- 后端受控 API，用于返回确定性的依赖解析风险分析结果。
- 前端引导式工作台，用于选择固定样例并观察漏洞版与修复版差异。
- `lab_event_logs` 事件日志写入。
- 元数据、场景文档、手动验证、服务端 / 前端测试和只读一致性验证。

本轮和首版实现均不包含：

- 不运行 `npm install`、`pnpm install`、`yarn install`、`pip install` 或任何真实依赖安装命令。
- 不访问真实 npm、pnpm、PyPI、Maven、私有 registry 或镜像源。
- 不发布真实包。
- 不创建真实投毒包、包归档、包发布脚本或生命周期脚本。
- 不读取 `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token、registry 凭据或真实依赖缓存。
- 不生成可复制到真实包生态的攻击脚本、发布步骤或投毒模板。

## 3. 已确认上下文

- `docs/design/next-wave-security-labs.md`
  - `supply-chain/dependency-confusion` 是下一波首批推荐实验第五项。
  - 首版建议使用固定 `package.json` 片段和伪 registry 元数据。
  - 禁止发布真实包、安装未知远程依赖、创建真实投毒包或生命周期脚本。
- `docs/design/project-scope-and-security-content.md`
  - 供应链内容建议以前端 / 后端依赖案例、伪包演示、更新链路说明和案例分析为主。
- `docs/design/lab-metadata-structure.md`
  - 后续元数据应继续使用稳定 `id`、`slug`、`category`、`subcategory`、`mode`、`status`、`variants`、`entrypoints`、`verification` 和 `paths`。
  - 进入实现前必须先满足“可注册”条件。
- `docs/execution/security-lab-master-goal.md`
  - 后续实验必须提供攻击方观察路径、防御方修复路径、结构化控制台日志和数据库事件日志。
  - 棘手问题必须说明如何安全模拟、哪些能力被刻意限制、学习者应该观察什么。
- 当前仓库状态
  - 已有 `lab_event_logs` 统一事件日志表和服务。
  - 当前尚不存在 `labs/supply-chain/dependency-confusion/` 或 `tools/lab-scripts/supply-chain/dependency-confusion/`。

## 4. 场景定位

建议元数据初始值：

- 实验 id：`supply-chain.dependency-confusion`
- slug：`dependency-confusion`
- 分类：`supply-chain`
- 子分类：`dependency-confusion`
- 模式：`simulation`
- 初始状态：`planned`
- 风险等级：`high`
- 难度：`intermediate`

采用 `simulation` 的原因：

- 依赖混淆真实复现会触碰包发布、安装解析、registry 访问和供应链投毒风险。
- 本项目只用固定样例解释解析风险，不连接真实包生态。
- 漏洞版和修复版的差异来自内存固定数据和确定性规则，不来自真实安装过程。

## 5. 学习目标

攻击方视角只用于理解风险，不用于构造真实投毒能力：

- 攻击者会观察组织内部依赖命名、scope 使用情况、registry 解析优先级和 lockfile 缺失情况。
- 攻击者希望利用私有包名与公共包名冲突，让解析链路偏向错误来源。
- 学习者需要观察哪些配置会让“同名包”“未绑定 scope”“缺少来源审计”变成风险信号。

防御方视角需要训练：

- 使用组织 scope 或明确命名空间，降低私有包名与公共包名冲突风险。
- 将私有 scope 固定到可信 registry，并禁止未授权来源解析。
- 保留 lockfile、完整性摘要和包来源审计证据。
- 对 CI / 本机安装环境做 registry 配置审计，不在日志中暴露 token 或凭据。
- 建立依赖引入审批、来源复核和异常解析告警流程。

## 6. 固定模拟数据模型

首版只允许固定 key，不接收任意包名、真实 registry URL、真实 lockfile 或真实凭据。

建议固定 manifest 样例：

- `unscoped-internal-name`：内部包未使用 scope，存在同名公共包解析风险。
- `scoped-private-package`：内部包使用组织 scope，并绑定私有 registry。
- `mixed-source-review`：同一 manifest 中同时存在公开依赖和私有依赖，用于观察来源审计。

建议固定伪 registry 场景：

- `public-name-collision`：伪公共 registry 存在同名更高版本包，漏洞版解析会偏向不可信来源。
- `private-scope-pinned`：私有 scope 被固定到可信来源，修复版解析保持内部来源。
- `lockfile-integrity-mismatch`：固定 lockfile 摘要与伪 registry 元数据不一致，用于展示审计阻断。

建议固定解析策略：

- `prefer-public-latest`：漏洞版教学策略，展示错误地偏向公共更高版本的风险。
- `scope-pinned-private`：修复版教学策略，展示 scope 与私有 registry 绑定。
- `lockfile-integrity-audit`：修复版教学策略，展示 lockfile 与完整性校验。

以上字段是后续实现建议。进入代码实现前，必须再次以共享类型、元数据规范和实际服务设计确认字段名，不允许用猜测字段兜底。

## 7. 漏洞版设计

漏洞版不是包发布器或安装器，而是“依赖解析风险观察模式”：

- 页面展示固定 manifest 片段、固定伪 registry 元数据和固定解析策略。
- 学习者可以观察未使用 scope、缺少 registry 绑定或缺少 lockfile 时，解析结果如何偏向不可信来源。
- 后端返回固定分析结果，例如 `decision: accepted`、`signal: dependency-confusion-public-source-selected`。
- 事件日志只记录固定 key、解析来源类别、风险标签数量、是否命中固定样例和学习信号。

禁止：

- 不展示真实可发布包内容。
- 不提供包发布命令、安装命令、registry 登录或凭据配置步骤。
- 不生成包归档、生命周期脚本、投毒模板或可复制的攻击链。

## 8. 修复版设计

修复版作为“依赖来源审计与解析收敛模式”：

- 页面展示同一固定样例经过 scope、私有 registry 绑定、lockfile 和完整性校验后的结果。
- 后端根据固定策略返回阻断、来源收敛、完整性校验通过或审计告警建议。
- 固定安全案例可返回 `accepted`，用于证明正常公开依赖仍可被正确解析。
- 日志记录固定审计项、来源类别、风险等级、建议动作和学习信号。

建议学习信号：

- `dependency-confusion-public-source-selected`
- `dependency-confusion-private-scope-missing`
- `dependency-confusion-registry-source-audited`
- `dependency-confusion-lockfile-integrity-blocked`
- `dependency-confusion-private-scope-pinned`
- `dependency-confusion-safe-public-package-accepted`
- `dependency-confusion-boundary-verified`

## 9. 后端与日志设计

后端服务建议：

```text
apps/server/src/services/dependency-confusion-lab.ts
```

API 建议：

```text
POST /api/labs/supply-chain/dependency-confusion/:variant/resolve
```

请求体后续建议只允许固定 key：

- `manifestKey`
- `registryScenarioKey`
- `resolutionPolicyKey`

禁止读取或保存：

- 任意真实包名列表。
- 真实 registry URL。
- 真实 lockfile 内容。
- `.npmrc`、`.yarnrc`、`.pypirc` 或环境变量中的 token。
- registry 用户名、密码、访问令牌或组织内部包元数据。
- 本机依赖缓存、全局包目录或真实项目依赖树。

统一事件日志摘要建议：

- `manifestKey`
- `registryScenarioKey`
- `resolutionPolicyKey`
- `resolvedSource`
- `riskIndicators`
- `auditActions`
- `matchedControlledSample`
- `signal`

不得记录完整 manifest、真实包名清单、真实 registry 地址、token、Cookie、凭据、内部组织名或本机路径。

## 10. 前端设计

前端建议使用依赖解析观察工作台，但必须保持固定样例：

- 左侧固定 manifest 样例列表。
- 中间固定伪 registry 元数据对比。
- 右侧解析策略、审计结果和防御建议。
- 漏洞版突出“为什么错误解析会发生”。
- 修复版突出“如何通过来源绑定和完整性校验收敛风险”。
- 展示最近事件复盘卡片，继续复用统一事件日志。

页面不得提供：

- 任意包名、版本号、registry URL 或 scope 输入框。
- 安装、发布、登录、下载、打包或执行按钮。
- `.npmrc`、token、CI 密钥、Cookie 或凭据输入。
- 生命周期脚本编辑器、包内容编辑器或可复制投毒模板。
- 真实包生态连接状态或真实安装日志。

## 11. 脚本与验证边界

首版不创建 `exploit.py`。

后续脚本目录只允许：

- `README.md`：说明脚本边界。
- `verify.ts`：只读一致性验证脚本，校验元数据、文档、固定样例、前端、后端和测试入口。

`verify.ts` 不得：

- 运行任何安装、发布、登录、下载或打包命令。
- 请求真实 registry、镜像源或私有包服务。
- 读取 `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token 或真实凭据。
- 生成包归档、生命周期脚本或投毒样例。
- 写入 `node_modules`、全局包目录、依赖缓存或真实项目 manifest。

## 12. 操作步骤

后续实施按以下切片推进：

1. 建立 `labs/supply-chain/dependency-confusion/` 标准目录和 `planned` 元数据，只登记 docs 入口。
2. 编写场景 README、漏洞版说明、修复版说明、mock 固定样例说明、攻击方观察步骤、修复说明和手动验证文档。
3. 建立后端固定解析服务和受控 `resolve` API，接入统一事件日志安全摘要。
4. 补齐服务端 API 测试，覆盖漏洞版错误来源选择、修复版来源收敛、lockfile 完整性阻断、正常公开依赖和未知 key 脱敏阻断。
5. 建立前端 API client、固定样例模型、依赖解析观察工作台和路由。
6. 补齐前端模型 / API / 路由测试。
7. 补齐 Playwright 页面差异验证，确认漏洞版 / 修复版差异和无任意输入框。
8. 补齐本机只读一致性验证脚本。
9. 按 simulation ready 标准做收口审计。

## 13. 棘手问题与风险分析

- 依赖混淆真实复现会触碰真实包生态，可能变成可复用投毒教程；本项目只使用固定 manifest 摘要和伪 registry 元数据。
- 如果提供安装或发布命令，学习环境可能误访问真实 registry；因此首版禁止任何真实安装、发布、登录或下载动作。
- 如果读取 `.npmrc`、环境变量 token 或 CI 凭据，会引入真实敏感信息风险；因此所有凭据类输入和读取都被禁止。
- 如果生成生命周期脚本或包归档，即使不发布也可能被误用；因此脚本与页面都不得生成可运行包内容。
- 如果日志保存完整 manifest 或内部包名清单，可能泄露组织命名习惯；因此日志只保存固定 key 和来源类别摘要。
- 如果修复版只做“全部阻断”，学习者无法理解正常依赖如何继续可用；修复版应展示公开依赖、私有依赖和异常依赖的不同处理方式。

## 14. 优化方案

- 首版使用内存固定规则，降低运行环境复杂度。
- 用伪 registry 元数据表替代真实网络请求。
- 用固定 key、风险标签和来源类别替代完整包名清单。
- 日志复用 `lab_event_logs`，不新增专用表。
- Playwright 和只读脚本都要检查页面没有任意包名、registry URL、token、安装或发布入口。
- 后续如需扩展恶意包注入或更新投毒，必须另写执行文档并继续使用案例化边界。

## 15. 验证方式

本执行文档切片的最小验证：

- `git diff --check -- docs/execution/2026-07-02-supply-chain-dependency-confusion-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md`
- `rg -n "[ \t]+$" -- docs/execution/2026-07-02-supply-chain-dependency-confusion-lab.md docs/design/next-wave-security-labs.md docs/TODO.md docs/execution/security-lab-master-goal.md`
- 安全关键词扫描，确认未新增真实安装、真实发布、registry 连接、凭据读取、生命周期脚本生成或可复用投毒流程。

后续实现切片的最小验证建议：

- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server test -- tests/dependency-confusion-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/web exec vitest run tests/dependency-confusion-api.test.ts tests/dependency-confusion-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/testing e2e -- --grep "依赖混淆"`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/supply-chain/dependency-confusion/verify.ts`

## 16. 本轮完成条件

- 执行文档明确首版定位、固定模拟数据、安全边界、后端 / 前端建议和后续切片顺序。
- 文档明确不安装未知远程依赖、不访问真实 registry、不发布真实包、不创建投毒包或生命周期脚本、不读取真实凭据。
- `docs/design/next-wave-security-labs.md`、`docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md` 同步 `supply-chain/dependency-confusion` 已进入执行文档阶段。
- 文档级验证通过后再提交。
