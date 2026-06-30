# SSRF 手动验证

## 验证 1：正常公开资源

1. 进入 `/labs/web/ssrf/vuln`。
2. 点击“填入公开资源”。
3. 点击“抓取资源”。
4. 预期信号：`ssrf-public-resource-fetched`。
5. 切换到 `/labs/web/ssrf/fixed` 后重复提交。
6. 预期信号仍为：`ssrf-public-resource-fetched`。

## 验证 2：漏洞版暴露内部模拟元数据

1. 进入 `/labs/web/ssrf/vuln`。
2. 点击“填入攻击样例”。
3. 点击“抓取资源”。
4. 预期结果：
   - HTTP 状态码为 200。
   - 页面后端决策显示 `accepted`。
   - 学习信号显示 `ssrf-internal-metadata-exposed`。
   - 页面展示内部模拟资源。

## 验证 3：修复版阻断同一目标

1. 进入 `/labs/web/ssrf/fixed`。
2. 点击“填入攻击样例”。
3. 点击“抓取资源”。
4. 预期结果：
   - HTTP 状态码为 403。
   - 页面后端决策显示 `blocked`。
   - 学习信号显示 `ssrf-private-target-blocked`。
   - 页面不展示内部模拟资源。

## 验证 4：事件日志

完成漏洞版和修复版攻击样例后，检查后台输出或数据库 `lab_event_logs`：

- 漏洞版事件应为 `phase=attack`、`decision=accepted`。
- 修复版事件应为 `phase=defense`、`decision=blocked`。
- 两条记录都应属于 `labKey=web.ssrf`。
- `inputSummaryJson` 不应包含真实凭据或真实外部目标信息。

## 自动化入口

- 服务端测试：`apps/server/tests/ssrf-lab.test.ts`
- 前端 API 测试：`apps/web/tests/ssrf-api.test.ts`
- 前端模型测试：`apps/web/tests/ssrf-lab.test.ts`
- 脚本验证：`tools/lab-scripts/web/ssrf/verify.ts`
