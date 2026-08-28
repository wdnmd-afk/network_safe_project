# LT-042 Kubernetes RBAC 固定配置审计实验执行文档

> 对应长期目标：`LT-042`
>
> 文档状态：进行中
>
> 创建时间：2026-08-28

## 1. 背景与目标

`LT-014` 规划、`LT-026` 补写的 `docs/design/cloud-native-iac-labs.md` 把云原生方向的首批四项候选排序为：云 IAM 策略审计（`LT-026` 已完成）、对象存储公开暴露、Kubernetes RBAC、Terraform/IaC 配置审计。

`LT-040` 第三轮审计将 Kubernetes RBAC 提前为 `LT-042`，原因是它补的是"命名空间边界 + 动词范围 + 绑定主体"这一组与云 IAM 不同的授权模型：云 IAM 审的是策略文档四要素，RBAC 审的是 Role/ClusterRole 的动词与资源范围，以及 RoleBinding/ClusterRoleBinding 把哪些主体拉进了这个范围。

本任务目标是新增 `infrastructure.kubernetes-rbac-audit` 实验，使用固定虚构 Role/Binding 快照，让学习者对比"过宽 ClusterRole 绑定给宽泛主体"与"命名空间内最小权限 Role 绑定给具名 ServiceAccount"两种基线，并完成两步授权处置决策。

## 2. 范围

### 2.1 纳入范围

- 服务端专用服务：固定 RBAC 快照常量、确定性审计纯函数、第二版两步状态机。
- 专用 API：工作台 `GET` 与漏洞版/修复版 `POST` 评估，接入统一事件日志安全摘要。
- 前端：专用 API 客户端、变体配置模块、专用视图、路由注册（置于通用 catch-all 之前）。
- 标准实验目录：`meta.json`、README、`vuln/`、`fixed/`、`mock/`、`docs/` 三份文档。
- 脚本目录：`tools/lab-scripts/infrastructure/kubernetes-rbac-audit/` 的 README 与只读 `verify.ts`。
- 测试：服务端专用 API 测试、前端路由测试断言。
- 覆盖矩阵新增行与相关文档同步。

### 2.2 不纳入范围

- 不连接真实集群、不读取 kubeconfig、不调用 kubectl 或 Kubernetes API。
- 不新增 `cloud` 分类（规划文档第 3 节已确认复用 `infrastructure`）。
- 不新增数据库表或字段。
- 不提供 `exploit.py`。
- 不做 Playwright 页面用例（E6 证据留待后续统一批次，与 `LT-029`/`LT-031` 的做法一致）。
- 不做生产构建与 nginx 复验（`LT-041` 已完成，本任务不重复）。

## 3. 模式与深度决策

| 项目 | 决策 | 依据 |
|---|---|---|
| 分类 | `infrastructure` | 规划文档第 3 节；不新增 `cloud` 分类 |
| 模式 | `simulation` | 见下方说明 |
| 深度 | D3 专用模拟 | 固定快照对比 + 两步决策，与 `LT-026` 同档 |

关于模式：规划文档第 2 节建议 Kubernetes RBAC 用 `case-study`。本任务改为 `simulation`，理由是本实验与 `LT-026` 同构——都是"固定配置快照 + 确定性计数 + 两步决策"的可交互审计，而非只读案例阅读。`case-study` 在本项目有额外约束（`supportsAutomation: false`、不得声明攻击脚本自动化），用在这里会让两个变体无法登记 API 自动化证据，与实际实现不符。这是对规划文档的偏离，已在此说明原因与影响范围；规划文档第 2 节的建议模式一栏将同步标注该调整。

## 4. 固定模型设计

### 4.1 RBAC 快照字段

复用 `LT-026` 的"语义枚举 + 冻结常量"范式，字段全部新增确认，不猜测：

```
bindingKey            虚构绑定标识，virtual- 前缀
displayName           展示名
roleScope             cluster-wide | namespace-scoped
verbScope             wildcard-all | write-verbs | read-only-verbs
resourceScope         wildcard-all | explicit-resources
subjectScope          broad-group | named-service-account
secretsReadable       boolean，是否可读 Secret
privilegeEscalationReachable  boolean
expectedPosture       vulnerable | hardened
findings              固定发现文案数组
```

### 4.2 两份固定快照

- `virtual-cluster-admin-broad-binding`：`cluster-wide` + `wildcard-all` 动词 + `wildcard-all` 资源 + `broad-group` 主体，可读 Secret，提权可达，`vulnerable`，4 项发现。
- `virtual-namespaced-readonly-binding`：`namespace-scoped` + `read-only-verbs` + `explicit-resources` + `named-service-account`，不可读 Secret，提权不可达，`hardened`，0 项发现。

### 4.3 审计计数规则

确定性推导，不解析真实 YAML：

- `criticalFindingCount` = (动词通配符 且 资源通配符 且 集群范围) + (可读 Secret) + (提权可达)，锁定值 3 / 0。
- `leastPrivilegeControlCount` = (命名空间范围) + (非通配符动词) + (显式资源) + (具名 ServiceAccount) + (Secret 不可读)，锁定值 0 / 5。

### 4.4 固定 key

- 场景：`fixed-kubernetes-rbac-audit`
- 步骤一 `rbac-scope-assessment`：`accept-cluster-admin-binding` / `scope-binding-to-namespace`
- 步骤二 `rbac-binding-decision`：`approve-overbroad-binding`（risk）/ `block-overbroad-binding`（fix）/ `verify-namespaced-baseline`（normal）
- 信号：`infrastructure-kubernetes-rbac-audit-risk-accepted` / `-defense-blocked` / `-normal-verified` / `-boundary-blocked`

## 5. 实施步骤

1. 服务端服务 `apps/server/src/services/kubernetes-rbac-audit-lab.ts`：固定快照、`assessFixedRbacBinding`、第二版定义、`createKubernetesRbacAuditLabService`。
2. `apps/server/src/app.ts`：导入服务、注册可选依赖、新增两条路由（置于 `/api/labs/:category/:scene/workbench` 之前）、变体读取辅助函数、事件日志摘要只写固定 key 与计数。
3. 前端 `apps/web/src/api/kubernetes-rbac-audit-lab.ts`、`apps/web/src/labs/kubernetes-rbac-audit.ts`、`apps/web/src/views/KubernetesRbacAuditLabView.vue`、`apps/web/src/router/routes.ts`。
4. 标准实验目录与七份文档。
5. 脚本目录 README 与只读 `verify.ts`。
6. 服务端专用测试 `apps/server/tests/kubernetes-rbac-audit-lab.test.ts`；前端路由测试补断言。
7. 覆盖矩阵新增第 17 节行；同步规划文档模式标注。
8. 元数据先 `in-progress`，专项与根级门禁通过后再推进 `ready`。
9. 同步长期目标、TODO、README、AGENTS 计数。

## 6. 潜在风险分析

| 风险 | 影响 | 控制方式 |
|---|---|---|
| 与 `LT-026` 退化为同义实验 | 学习价值重复 | 字段与计数聚焦命名空间/动词/绑定主体，不复制四要素结构 |
| 模式偏离规划文档 | 文档与实现不一致 | 第 3 节说明偏离原因，并同步规划文档标注 |
| 实验计数漂移 | 覆盖矩阵与断言失配 | 一次性同步矩阵、长期目标、README、AGENTS 的 75→76 与 150→152 |
| 路由被通用 catch-all 抢占 | 专用页面不可达 | 专用路由前置，并由 `verify.ts` 断言顺序 |
| YAML 正文进入 API | 越过固定数据边界 | API 只接受 `scenarioKey` 与 `decisions`，未知 key 脱敏阻断 |
| 事件日志写入敏感内容 | 数据风险 | 只记录固定 bindingKey、计数、终止结果与信号 |

## 7. 安全边界

- 不连接、认证或修改任何真实 Kubernetes 集群、命名空间、Role 或 Binding。
- 不调用 kubectl、Kubernetes API、client-go、helm 或任何集群 SDK。
- 不读取 kubeconfig、ServiceAccount token、集群证书或本机云凭据。
- 不启动容器、Pod 或任何真实工作负载。
- 不输出可直接用于真实集群的提权清单或绕过步骤。
- 不提供 `exploit.py`。

## 8. 完成标准

- [x] 服务端服务、API、事件日志摘要落地。
- [x] 前端 API 客户端、变体配置、视图、路由落地。
- [x] 标准实验目录七份文档齐备。
- [x] 只读 `verify.ts` 全项通过。
- [x] 服务端专用测试通过。
- [x] 覆盖矩阵新增行且计数一致。
- [x] 根级 `pnpm verify` EXIT=0。
- [x] 元数据推进 `ready`。
- [x] 长期目标、TODO、README、AGENTS 同步。
- [x] `git diff --check` 通过并提交。

## 9. 验收证据

执行时间：2026-08-28 16:59:05 +08:00。

### 9.1 固定绑定与审计计数

由 `assessFixedRbacBinding` 对两份冻结快照确定性推导，实测值：

| 绑定 | 姿态 | 发现数 | 关键组合风险 | 最小权限控制 |
|---|---|---:|---:|---:|
| `virtual-cluster-admin-broad-binding` | vulnerable | 4 | 3 | 0 |
| `virtual-namespaced-readonly-binding` | hardened | 0 | 0 | 5 |

### 9.2 专项只读验证

`tools/lab-scripts/infrastructure/kubernetes-rbac-audit/verify.ts`：`ok: true`，18/18 检查全部通过，含元数据结构、case-study ready 边界、五要素语义一致性、路由顺序、无 `exploit.py` 与无禁用运行能力。

### 9.3 服务端专用测试

`apps/server/tests/kubernetes-rbac-audit-lab.test.ts`：9/9 通过。覆盖冻结快照与锁定计数、风险路径、防御阻断路径、正常基线路径、未知/不完整/尾随决策脱敏阻断、工作台只暴露固定绑定、评估接口要求登录、事件日志只记录固定 key、防御路径返回 403。

### 9.4 根级门禁

`pnpm verify` EXIT=0：

- 前后端类型检查通过。
- `test:shared` 67/67。
- `test:guided` 30/30，`ok: true`。
- `test:controlled` 5 项专项验证全部 `ok: true`（含本实验新增项）。
- `test:entrypoints`：76 实验、152 个 Web 入口、152 匹配、错误 0。
- `test:api-entrypoints`：76 实验、201 个 API 入口、201 匹配、68/68 实验路由覆盖、错误 0。
- `test:coverage`：76/76、矩阵 76 行、专用 46、引导式 30、14 分类、`infrastructure` 7、模式 26/21/29、`ok: true`。
- `test:server` 372/372。
- `test:web:run` 285/285（80 个测试文件）。

### 9.5 实施过程中修正的缺陷

1. `app.ts` 首次编辑误将服务声明与装配各重复插入 9 份，已收敛为单份。
2. 服务端事件摘要误用不存在的 `scopedControlCount`，已改为真实字段 `leastPrivilegeControlCount`。
3. 前端 API 类型的 `bindingScope` / `single-namespace` / `all-service-accounts` / `explicit-verbs` 与服务端真实模型不一致，已全部对齐为 `roleScope` / `namespace-scoped` / `broad-group` / `read-only-verbs` 等真实枚举。
4. 视图缺失 `bindingKeyByAssessmentOption` 导出、引用了不存在的 `namespaceScope`、并存在与 `roleScope` 语义重复的 `bindingScope` 行，已补导出、改为渲染 `roleScope` 并删除重复项。
5. 只读验证器曾把 `kubectl` 列为禁用运行片段，导致服务中"不调用 kubectl"的边界声明被误判；按参考实现既有原则移除该裸字符串片段。
6. 服务端测试断言曾使用不存在的 `namespaceScope` 字段，已改为校验真实 `roleScope`。
7. 元数据初版缺少 case-study ready 所需的边界与 notes 证据，已按 `validateReadyCaseStudyMetadata` 的准确要求补齐。
8. 随实验数由 75 增至 76，同步更新既有硬编码计数：`lab-registry.test.ts`（76/76 ready、152 变体）、`health.test.ts`（total 76）、`api-entrypoint-consistency.test.ts`（labCount 76、API 入口 201）、`security-coverage-matrix.test.mjs`（76、46 专用、case-study 29、infrastructure 7）。

### 9.6 未执行项

本切片未执行生产 `build`、`test:smoke`、数据库集成与 Playwright E2E；元数据 `verification.automation.playwright.enabled` 保持 `false`，覆盖矩阵 Playwright 证据仍为 28，未虚报页面级证据。

## 10. 交付物

- 本执行文档与验收证据。
- 服务端服务、路由与专用测试。
- 前端 API、配置、视图与路由。
- 标准实验目录与脚本目录。
- 覆盖矩阵、长期目标、TODO、README、AGENTS 同步。
