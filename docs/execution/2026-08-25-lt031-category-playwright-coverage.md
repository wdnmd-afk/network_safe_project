# LT-031 新专用实验分类代表性 Playwright 执行文档

## 1. 目标

为 `LT-021`～`LT-027` 交付的 7 个专用实验补齐风险、防御、正常三向 Playwright 页面证据，使当前 14 个正式分类均至少具备一条代表性端到端路径。

目标实验：`api.functional-authorization`、`business-logic.workflow-bypass`、`crypto.insecure-randomness`、`detection.rule-alert-triage`、`host.service-permission-audit`、`infrastructure.iam-policy-audit`、`client.mitb`。

## 2. 范围与步骤

1. 核对 7 个页面的标题、固定按钮、状态面板和 canonical 信号。
2. 在统一 Playwright 文件中为每个实验建立独立三向用例。
3. 对页面断言无自由文本攻击输入，并只操作固定按钮。
4. 启用对应元数据 Playwright 证据，更新覆盖矩阵统计。
5. 运行目标用例、完整 E2E、覆盖矩阵和根级门禁。

## 3. 实施建议与风险

- 每个实验单独生成测试，避免单个循环失败后无法定位。
- MITB 和 Windows/检测主题只验证固定摘要，不接触真实浏览器、主机或日志。
- 元数据只在真实页面用例通过后登记 E6，避免证据提前声明。

## 4. 优化与验证

- 复用登录和学习信号定位辅助函数。
- 验证：目标 Playwright、`pnpm test:e2e`、`pnpm test:coverage`、`pnpm verify`、`git diff --check`。

## 5. 完成条件

- 7 个实验均有三向页面证据，14 分类代表性 E2E 无缺口。
- 元数据、覆盖矩阵和真实用例一致，完整 E2E 通过。

## 6. 验证结果（2026-08-27）

- 7 个目标实验三向用例全部通过；完整 `pnpm test:e2e` 为 40/40。
- 对应元数据已启用 Playwright，覆盖矩阵 E6 总数由 17 增至 28，14 个分类均有代表性页面回归。
- `pnpm test:coverage`、`pnpm verify` 和 `git diff --check` 均通过。
