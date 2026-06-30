# 单个实验详情页复用模式设计

## 1. 文档定位

本文档定义后续实验如何复用现有单个实验详情页。

目标是让新增实验只需要补齐元数据、工作台入口、事件日志和验证资源，就能自然出现在详情页中，而不是为每个实验复制一套详情页。

## 2. 职责边界

### 2.1 通用详情页负责

`apps/web/src/views/LabDetailView.vue` 作为通用详情页，负责以下内容：

- 展示实验基础信息：分类、子类、标题、摘要、状态、风险等级、难度和模式。
- 展示实验变体，并把变体入口导航到对应工作台页面。
- 展示知识点、验证方式、文档入口和脚本入口。
- 展示当前登录用户在该实验下的学习进度和验证记录。
- 展示当前实验最近事件复盘。
- 展示固定引导式复盘问题，并支持当前用户完成状态读取与写回。

### 2.2 实验工作台页面负责

每个具体实验的工作台页面负责以下内容：

- 承载漏洞版 / 修复版交互流程。
- 展示攻击方视角和防御方视角下的可操作步骤。
- 调用该实验对应的后端受控业务接口。
- 写入学习进度、验证记录和统一实验事件日志。
- 处理实验专属输入、响应展示和页面状态。

工作台页面可以按实验定制；详情页必须保持通用。

### 2.3 后端服务负责

后端实验 service 和 API 负责以下内容：

- 执行本机受控实验逻辑。
- 记录 `lab_event_logs`。
- 返回适合前端学习复盘的结构化结果。
- 避免把真实敏感信息、完整攻击 payload 或外部目标信息写入可展示字段。

## 3. 元数据契约

详情页只依赖 `LabMetadata` 中已经确认的字段，不允许新增猜测式字段。

后续实验至少应保证以下字段完整：

- `id`
- `slug`
- `title`
- `category`
- `subcategory`
- `mode`
- `severity`
- `difficulty`
- `summary`
- `status`
- `tags`
- `knowledgePoints`
- `variants`
- `entrypoints`
- `verification`
- `prerequisites`
- `paths`

其中详情页核心依赖：

- `variants`
- `entrypoints.web`
- `entrypoints.docs`
- `entrypoints.scripts`
- `knowledgePoints`
- `verification.manual`
- `verification.automation`
- `paths`

## 4. 变体入口规则

变体入口必须使用显式 key 关联：

```text
variant.entryKey -> entrypoints.web[].key
```

约束：

- 禁止根据 `category`、`scene`、`variant.key` 拼接路由。
- 禁止通过多个可疑字段兜底匹配入口。
- `variant.entryKey` 必须精确对应一个 `entrypoints.web[].key`。
- `entrypoints.web[].path` 必须指向已经注册的工作台路由。
- 如果某个变体暂时没有页面入口，详情页只能展示“暂无页面入口”，不能猜测跳转地址。

推荐后续增加元数据测试，批量校验每个启用变体都能找到对应 Web 入口。

## 5. 学习记录规则

详情页使用 `lab.id` 作为当前实验的 `labKey`。

当前实验记录只允许按以下字段过滤：

- `progress[].labKey`
- `verifications[].labKey`

约束：

- 禁止用标题、slug、路径或分类组合推导当前实验记录。
- 禁止写 `lab.id || lab.slug || ...` 这类兜底逻辑。
- 若后端返回结构不满足当前类型，应先修正接口或类型定义，再调整页面。

## 6. 事件日志规则

详情页通过当前用户事件日志接口读取当前实验复盘：

```text
GET /api/lab-event-logs/me?labKey=<lab.id>
```

详情页可展示字段限定为学习复盘所需摘要字段：

- `title`
- `variantKey`
- `phase`
- `eventType`
- `actorPerspective`
- `decision`
- `signal`
- `statusCode`
- `message`
- `riskLevel`
- `createdAt`

安全边界：

- 不展示 `inputSummaryJson`。
- 不展示真实密码、真实 token、真实 Cookie、真实密钥或完整 payload。
- 不展示外部真实目标地址。
- 不把本项目脚本描述为对外部目标的通用攻击工具。

新增实验接入事件日志时，应确保 `signal` 和 `message` 适合学习复盘，能说明系统做出了什么决策，但不泄露敏感输入细节。

## 7. 复盘问题完成状态规则

详情页固定引导式问题由 `createLabEventRecapQuestions(event)` 根据事件生成。

当前完成状态使用以下组合识别：

```text
traceId + questionIndex
```

约束：

- 不用问题文案作为完成状态 key。
- 不在前端自行生成新的 `traceId`。
- 保存时必须同时提交 `traceId`、`labKey`、`questionIndex` 和 `completed`。
- 如果后续调整问题顺序或数量，需要评估历史完成记录语义是否会变化。

如果未来需要实验专属复盘问题，应先设计配置来源和兼容策略，再修改通用详情页。

## 8. 新增实验接入清单

新增实验要复用详情页，应按以下顺序检查：

1. 在 `labs/<category>/<scene>/meta.json` 中补齐稳定 `id`、`slug`、`variants`、`entrypoints`、`verification` 和 `paths`。
2. 确保每个启用变体的 `entryKey` 能匹配 `entrypoints.web[].key`。
3. 在前端注册对应工作台路由，路径与 `entrypoints.web[].path` 保持一致。
4. 后端受控接口写入统一实验事件日志，`labKey` 使用 `lab.id`。
5. 文档入口放入 `entrypoints.docs`，脚本入口放入 `entrypoints.scripts`。
6. 手工验证文档记录正常路径、漏洞版信号和修复版信号。
7. 脚本只面向本机受控实验环境，放在 `tools/lab-scripts/<category>/<scene>/`。
8. 增加或更新元数据测试、API 差异测试、前端 helper 测试。
9. 从 `/labs/:category/:scene` 打开详情页，确认变体入口、记录和复盘展示正常。

## 9. 后续扩展实验边界

后续可规划的实验包括命令注入、SSTI、XXE、不安全反序列化、OAuth / SSO 配置错误等。

这些实验接入详情页时必须保持以下边界：

- 只使用本机、本项目、受控 mock 资源。
- 对高风险能力优先采用模拟执行、虚拟资源或案例化信号。
- 不提供可直接用于外部真实目标的通用脚本。
- 事件日志只记录学习信号和后端决策，不记录真实敏感输入。
- 修复版必须能说明具体阻断边界，不能只返回模糊失败。

## 10. 验证清单

文档规划阶段：

- 核对详情页字段均来自 `LabMetadata` 和已定义 API 类型。
- 核对复用规则未引入新接口或数据库字段。
- 执行 `git diff --check`。

代码接入阶段：

- 运行 `pnpm --filter @network-safe/web exec vitest run tests/lab-detail.test.ts`。
- 运行新增实验对应的前端 helper / API 测试。
- 运行新增实验对应的服务端 API 或 service 测试。
- 必要时补充 Playwright 入口验证。

