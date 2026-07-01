# 端口扫描前端工作台执行文档

## 1. 目标

本轮目标是在 `network/port-scan` 已有后端受控 API 基础上，补齐漏洞版与修复版前端工作台入口。

前端工作台只允许学习者从页面提供的固定虚拟资产和固定观察模式中选择，调用本项目已有 `POST /api/labs/network/port-scan/:variant/scan` 接口，观察虚拟端口暴露面、后端决策、学习信号和修复前后差异。

## 2. 范围

本轮包含：

- 新增 `apps/web/src/api/port-scan-lab.ts`。
- 新增 `apps/web/src/labs/port-scan.ts`。
- 新增 `apps/web/src/views/PortScanLabView.vue`。
- 在 `apps/web/src/router/routes.ts` 登记：
  - `/labs/network/port-scan/vuln`
  - `/labs/network/port-scan/fixed`
- 补充前端 API client、实验模型和路由测试。
- 更新 `labs/network/port-scan/meta.json`，登记前端页面入口。
- 更新端口扫描 README、手动验证、攻击步骤和修复说明。
- 更新 `docs/TODO.md`、`docs/design/next-wave-security-labs.md` 与 `docs/execution/security-lab-master-goal.md`。

本轮不包含：

- 不新增 `exploit.py`。
- 不新增真实端口扫描脚本。
- 不新增数据库迁移。
- 不新增真实 socket、系统命令、PowerShell、`nmap`、`Test-NetConnection`、`ping`、`tracert` 或类似探测能力。
- 不提供任意 IP、域名、网段、端口范围、超时、并发、代理、认证、Cookie 或 token 输入框。
- 不将 `network.port-scan` 标记为 `ready`。

## 3. 已确认上下文

- `docs/execution/2026-06-30-network-port-scan-lab.md` 已锁定端口扫描首版为“虚拟暴露面观察器”。
- `docs/execution/2026-06-30-network-port-scan-virtual-api.md` 已落地后端受控 API 切片。
- `apps/server/src/services/port-scan-lab.ts` 只维护固定内存虚拟资产表。
- `labs/network/port-scan/meta.json` 当前为 `status: "in-progress"`，已有 API 入口，web 入口为空。
- 前端现有实验模式为：`api/*-lab.ts`、`labs/*`、`views/*LabView.vue`、`router/routes.ts`、Vitest API / 模型 / 路由测试。
- 学习进度和验证记录复用 `apps/web/src/api/lab-records.ts`，不直接读取或展示 `inputSummaryJson`。

## 4. 页面设计

页面采用现有实验工作台布局：

- 左侧说明当前变体、学习视角、预期信号和安全边界。
- 右侧工作台提供固定虚拟目标选择器。
- 右侧工作台提供固定观察模式选择器。
- 页面提供快速选择按钮，用于切换高风险后台节点、办公网关和最小化服务。
- 提交后展示：
  - 后端决策
  - 学习信号
  - 虚拟目标
  - 暴露面评分
  - 公开端口数量
  - 高风险端口数量
  - 虚拟端口列表
  - 下一步引导

页面不得出现任意目标文本输入框。

## 5. API client 设计

前端只提交：

```ts
{
  targetKey: string;
  scanProfile: string;
}
```

前端 API client 不读取、不生成、不透传以下字段：

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

## 6. 学习记录与验证记录

进入页面时记录学习进度：

- category: `network`
- scene: `port-scan`
- variantKey: `vuln` 或 `fixed`
- status: `in-progress`

当观察结果命中预期信号时记录验证记录：

- 漏洞版预期信号：
  - `port-scan-management-surface-visible`
  - `port-scan-exposure-expanded`
- 修复版预期信号：
  - `port-scan-surface-reduced`
  - `port-scan-normal-inventory-returned`

验证详情只记录虚拟目标 key、观察模式、端口统计、暴露面评分和学习信号，不记录真实网络信息。

## 7. 实施步骤

1. 新增前端 API client 类型和提交函数。
2. 新增端口扫描实验模型、固定目标选项、固定观察模式、信号格式化和验证记录载荷生成函数。
3. 新增端口扫描前端工作台页面。
4. 将漏洞版 / 修复版路由加入前端路由表。
5. 更新 CSS 复用现有工作台面板样式，并补齐虚拟端口列表的稳定展示。
6. 更新元数据 web 入口、文档和进度记录。
7. 补齐前端 API client、实验模型、路由和共享元数据测试断言。
8. 运行最小必要验证。

## 8. 潜在风险

- 若页面提供任意目标输入，会偏离“虚拟资产观察器”边界，可能被误解为扫描器。
- 若前端展示原始危险字段或真实网络信息，会破坏脱敏日志和受控学习目标。
- 若元数据登记了未实现脚本或将实验标记为 `ready`，会造成进度与实际入口不一致。
- 若只测页面存在，不测 API client 请求体，可能遗漏意外字段透传问题。

## 9. 优化方案

- 后续可新增 Playwright 页面差异验证，但仍只操作固定目标和固定观察模式。
- 后续可新增只读 `verify.ts`，仅调用本项目 API 并校验元数据 / 页面入口 / API 差异，不实现真实扫描。
- 后续达到完成标准后再评估是否将状态从 `in-progress` 推进到 `ready`。

## 10. 验证方式

本轮最小必要验证：

- `pnpm --filter @network-safe/web exec vitest run tests/port-scan-api.test.ts tests/port-scan-lab.test.ts tests/router.test.ts`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/shared test`
- `git diff --check -- <本轮目标文件>`
- `rg -n "[ \t]+$" -- <本轮目标文件>`
- 安全关键词扫描确认本轮前端和端口扫描相关变更未新增真实 socket、系统命令、网段扫描或通用扫描器实现。
