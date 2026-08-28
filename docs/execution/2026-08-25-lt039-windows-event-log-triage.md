# LT-039 Windows 固定事件日志时间线研判执行文档

## 1. 目标

新增 `host.event-log-triage` 专用 case-study D3 实验，复用检测响应固定事件 schema，展示 Windows 异常登录、权限组变更和服务安装的脱敏时间线研判。

## 2. 固定数据与状态机

- 在共享模块新增 `fixedWindowsSecurityEventDataset`，继续使用 `eventId`、相对 `timestamp`、固定 `source/category/severity/signalTags/summary/expectedDisposition` 字段。
- 固定事件包含异常登录、虚构特权组变更、虚构服务安装和已登记维护服务安装。
- 不读取真实 Event Log、注册表、服务或主机名。
- 请求只接受 `scenarioKey: fixed-windows-identity-service-timeline` 与有序 `decisions`。

两步决策：单事件信任 / 多事件关联 -> 忽略 / 升级调查 / 维护基线正常关闭。

## 3. 范围、风险与验证

- 交付共享数据测试、专用服务/API、时间线页面、元数据、文档、专用测试和 `verify.ts`；不提供 `exploit.py`。
- case-study 变体保持 `supportsAutomation: false`，API + script 两类证据满足 ready 例外。
- 验证共享、专项、前后端、entrypoints、coverage、`pnpm verify`。

## 4. 完成条件

- 时间线、风险/防御/正常研判均可确定性复现，安全边界证明未读取或处置真实 Windows 状态。

## 5. 验证结果（2026-08-27）

- 共享固定 Windows 事件 schema 测试和专项只读验证均通过，专项报告 `ok: true`。
- API/前端测试、Web/API 入口门禁、覆盖矩阵、根级 `pnpm verify` 和 Playwright 三向回归均通过。
- 元数据已推进为 `ready` 并启用 E6；`variants[].supportsAutomation` 保持 `false`，无 `exploit.py` 或真实主机操作。
