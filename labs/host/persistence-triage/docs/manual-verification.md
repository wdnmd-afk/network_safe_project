# 持久化研判手工验证矩阵

> 全部验证只在本机受控实验环境执行，不读取或修改真实主机的计划任务、启动项与 ACL。

## 前置条件

- 本机后端服务运行于 `http://127.0.0.1:6667`。
- 本机前端已启动，或已通过 nginx 托管构建产物。
- 使用本项目本机演示账号登录（评估接口要求登录）。
- 不需要管理员权限、任务计划程序、注册表编辑器或任何主机排查工具。

## 固定契约

- 固定案例：`fixed-windows-autorun-persistence-timeline`
- 第一阶段 `persistence-scope-assessment`：`accept-unsigned-autorun-entry` / `harden-signature-and-path-acl`
- 第二阶段 `persistence-disposition`：`approve-persistence-retention` / `block-and-remove-persistence` / `verify-managed-autorun-baseline`

## 验证矩阵

| # | 路径 | 变体 | 决策序列 | 预期 HTTP | 预期信号 | 预期审计摘要 |
|---|---|---|---|---|---|---|
| 1 | 风险 | vuln | `accept-unsigned-autorun-entry` → `approve-persistence-retention` | 200 | `host-persistence-triage-risk-accepted` | 4 发现 / 2 关键风险 / 0 加固控制 |
| 2 | 防御 | fixed | `harden-signature-and-path-acl` → `block-and-remove-persistence` | 403 | `host-persistence-triage-defense-blocked` | 0 发现 / 0 关键风险 / 5 加固控制 |
| 3 | 正常 | fixed | `harden-signature-and-path-acl` → `verify-managed-autorun-baseline` | 200 | `host-persistence-triage-normal-verified` | 0 发现 / 0 关键风险 / 5 加固控制 |

## 边界验证矩阵

| # | 输入 | 预期结果 |
|---|---|---|
| 4 | 未登记 `scenarioKey`（如某个真实任务名） | 403，`scenarioKey` 返回 `blocked-scenario`，响应体不含原始输入 |
| 5 | 未登记 `optionKey` | 403，边界信号 `host-persistence-triage-boundary-blocked`，不回显原始值 |
| 6 | 只提交第一步决策 | 403，`blockedReason` 为 `path-incomplete` |
| 7 | 在终止步骤后追加决策 | 403，`blockedReason` 为 `decisions-after-terminal` |
| 8 | 未携带登录令牌 | 401 |
| 9 | 请求体附带真实主机路径、任务名、SID、域名或哈希等额外字段 | 200/403 按路径判定，且事件日志与响应均不含这些值 |

## 页面验证

1. 访问 `/labs/host/persistence-triage/vuln`，确认两份固定条目快照与五项语义枚举正常展示，`virtual-*` 标识可见。
2. 点击"载入推荐路径"后运行研判，确认风险路径返回 4 发现 / 2 关键风险。
3. 切换到 `/labs/host/persistence-triage/fixed`，运行防御路径，确认阻断结论与 5 项加固控制。
4. 点击"受控基线"载入正常路径，确认加固后的固定条目仍能通过复核。
5. 在账户中心或实验详情复盘事件日志，确认只出现固定 key、计数与学习信号。

## 自动化对照

- 只读一致性验证：`pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/host/persistence-triage/verify.ts`
- 服务端专用测试：`apps/server/tests/persistence-triage-lab.test.ts`
- 该实验为 case-study，变体 `supportsAutomation` 保持 `false`，不提供攻击脚本自动化。

## 安全边界确认项

- [ ] 全过程未打开任务计划程序、注册表编辑器或服务管理器。
- [ ] 全过程未创建、修改或删除任何真实计划任务与启动项。
- [ ] 全过程未读取真实文件系统 ACL、注册表或系统凭据。
- [ ] 未知输入被脱敏阻断，且响应与事件日志都不含原始值。
- [ ] 脚本目录下不存在 `exploit.py`。
