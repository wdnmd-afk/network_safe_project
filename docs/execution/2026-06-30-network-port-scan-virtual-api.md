# 端口扫描虚拟资产观察 API 执行文档

## 1. 目标

本轮目标是在 `network/port-scan` 已有 planned 目录与元数据基础上，补齐首个后端受控 API 切片。

该 API 只返回固定虚拟资产表中的端口暴露面观察结果，用于学习攻击方如何从开放端口推断暴露面，以及防御方如何通过最小暴露面治理降低风险。

## 2. 范围

本轮包含：

- 新增 `apps/server/src/services/port-scan-lab.ts`。
- 新增 `POST /api/labs/network/port-scan/:variant/scan`。
- 新增 `apps/server/tests/port-scan-lab.test.ts`。
- 将 `labs/network/port-scan/meta.json` 从 `planned` 推进到 `in-progress`。
- 在元数据中登记 API 入口和 API 测试证据。
- 更新 `docs/TODO.md` 与 `docs/execution/security-lab-master-goal.md`。

本轮不包含：

- 不新增前端页面。
- 不新增数据库迁移。
- 不新增 `exploit.py` 或 `verify.ts`。
- 不执行真实端口扫描。
- 不调用 socket、系统命令、PowerShell、`nmap`、`Test-NetConnection`、`ping`、`tracert` 或类似探测工具。

## 3. 已确认上下文

- `docs/execution/2026-06-30-network-port-scan-lab.md` 已锁定端口扫描首版为“虚拟暴露面观察器”。
- `labs/network/port-scan/meta.json` 当前为 `planned`，只登记 docs 入口。
- `apps/server/src/app.ts` 已有各实验 API 的统一模式：读取登录用户、校验变体、调用 service、写入 `lab_event_logs`、返回 `{ status, result }`。
- `apps/server/src/services/lab-event-logs.ts` 已支持脱敏 `inputSummary` 和数据库写入降级。
- 当前 `lab_event_logs` 表已存在，本轮不需要新增数据库字段。

## 4. 接口设计

接口：

```text
POST /api/labs/network/port-scan/:variant/scan
```

允许请求字段：

| 字段 | 说明 |
|---|---|
| `targetKey` | 固定虚拟资产 key，只允许服务端白名单值 |
| `scanProfile` | 固定观察模式，只允许 `quick-observe` 或 `surface-review` |

禁止请求字段：

- `host`
- `ip`
- `cidr`
- `domain`
- `portRange`
- `timeout`
- `concurrency`
- `proxy`
- `authorization`
- `cookie`

本轮不会为了兼容这些字段做兜底读取；请求体中即使携带这些字段，也不会进入业务逻辑或日志摘要。

## 5. 虚拟资产模型

服务端只维护固定内存模型：

- `office-gateway`
- `admin-node`
- `hardened-service`

每个目标按 `vuln` / `fixed` 变体返回对应虚拟端口列表。端口信息只包含教学字段：

- `port`
- `protocol`
- `serviceLabel`
- `exposure`
- `riskLevel`
- `learningHint`

不得包含真实 IP、真实主机名、真实 banner 或真实服务指纹。

## 6. 事件日志设计

继续写入 `lab_event_logs`，日志摘要只包含：

- `targetKey`
- `scanProfile`
- `virtualPortCount`
- `openPortCount`
- `restrictedPortCount`
- `highRiskPortCount`
- `exposureScore`
- `matchedControlledSample`
- `signal`

事件映射：

| 场景 | phase | eventType | actorPerspective | riskLevel |
|---|---|---|---|---|
| 漏洞版暴露管理面 | `attack` | `success` | `attacker` | `high` |
| 修复版暴露面收敛 | `defense` | `success` | `user` | `low` |
| 非允许目标或观察模式 | `defense` | `blocked` | `attacker` | `medium` |
| 正常虚拟资产清单观察 | `normal` | `success` | `user` | `low` |

## 7. 实施步骤

1. 新增 `port-scan-lab` service，封装虚拟资产表、观察模式校验、暴露面统计和学习信号。
2. 在 `createApp` 中新增 service 注入点与路由。
3. 新增服务端测试，覆盖正常观察、漏洞版管理面暴露、修复版收敛、未知目标阻断、登录要求和事件日志摘要。
4. 更新 `network.port-scan` 元数据为 `in-progress` 并登记 API 入口。
5. 更新共享元数据测试对端口扫描的断言。
6. 同步 TODO 与主 goal 进度。

## 8. 潜在风险

- 若接收任意目标字段，API 会滑向扫描器。本轮只读取 `targetKey` 和 `scanProfile`。
- 若日志记录真实目标信息，可能泄露本机环境。本轮日志只记录虚拟 key 和统计摘要。
- 若测试只验证 happy path，无法证明禁止字段边界。本轮测试需要覆盖未知目标或非法观察模式被阻断。
- 若元数据误登记脚本入口，会暗示已提供攻击脚本。本轮 `entrypoints.scripts` 必须保持空数组。

## 9. 优化方案

- 后续前端页面再复用固定按钮 / 选择器，不提供文本目标输入。
- 后续若需要脚本，优先新增只读 `verify.ts`，仍不创建真实扫描脚本。
- 后续可以基于现有通用复盘卡片补充网络实验专属复盘问题。

## 10. 验证方式

本轮最小验证：

- `pnpm --filter @network-safe/server test -- tests/port-scan-lab.test.ts tests/health.test.ts tests/lab-registry.test.ts`
- `pnpm --filter @network-safe/shared test`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" <本轮目标文件>`
- 安全关键词扫描确认端口扫描相关变更未新增真实 socket、系统命令、网段扫描或通用扫描器实现。
