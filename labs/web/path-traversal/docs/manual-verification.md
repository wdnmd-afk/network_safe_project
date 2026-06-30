# 目录遍历手动验证

## 验证 1：正常公开文档

1. 进入 `/labs/web/path-traversal/vuln`。
2. 点击“填入公开文档”。
3. 点击“读取文档”。
4. 预期信号：`path-traversal-normal-file-read`。
5. 切换到 `/labs/web/path-traversal/fixed` 后重复提交。
6. 预期信号仍为：`path-traversal-normal-file-read`。

## 验证 2：漏洞版暴露内部模拟文档

1. 进入 `/labs/web/path-traversal/vuln`。
2. 点击“填入攻击样例”。
3. 点击“读取文档”。
4. 预期结果：
   - HTTP 状态码为 200。
   - 页面后端决策显示 `accepted`。
   - 学习信号显示 `path-traversal-sensitive-file-exposed`。
   - 页面展示内部模拟文档。

## 验证 3：修复版阻断同一路径

1. 进入 `/labs/web/path-traversal/fixed`。
2. 点击“填入攻击样例”。
3. 点击“读取文档”。
4. 预期结果：
   - HTTP 状态码为 403。
   - 页面后端决策显示 `blocked`。
   - 学习信号显示 `path-traversal-normalized-blocked`。
   - 页面不展示内部模拟文档。

## 验证 4：事件日志

完成漏洞版和修复版攻击样例后，检查后台输出或数据库 `lab_event_logs`：

- 漏洞版事件应为 `phase=attack`、`decision=accepted`。
- 修复版事件应为 `phase=defense`、`decision=blocked`。
- 两条记录都应属于 `labKey=web.path-traversal`。
- `inputSummaryJson` 不应包含真实系统路径。

## 自动化入口

- 服务端测试：`apps/server/tests/path-traversal-lab.test.ts`
- 前端 API 测试：`apps/web/tests/path-traversal-api.test.ts`
- 前端模型测试：`apps/web/tests/path-traversal-lab.test.ts`
- 脚本验证：`tools/lab-scripts/web/path-traversal/verify.ts`
