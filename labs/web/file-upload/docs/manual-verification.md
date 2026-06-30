# 文件上传手动验证

## 验证 1：正常图片样例

1. 进入 `/labs/web/file-upload/vuln`。
2. 点击“填入正常图片样例”。
3. 点击“提交上传”。
4. 预期信号：`file-upload-normal-image-stored`。
5. 切换到 `/labs/web/file-upload/fixed` 后重复提交。
6. 预期信号仍为：`file-upload-normal-image-stored`。

## 验证 2：漏洞版接受受控攻击样例

1. 进入 `/labs/web/file-upload/vuln`。
2. 点击“填入攻击样例”。
3. 点击“提交上传”。
4. 预期结果：
   - HTTP 状态码为 200。
   - 页面后端决策显示 `accepted`。
   - 学习信号显示 `file-upload-executable-stored`。
   - 页面展示模拟存储路径。

## 验证 3：修复版阻断同一攻击样例

1. 进入 `/labs/web/file-upload/fixed`。
2. 点击“填入攻击样例”。
3. 点击“提交上传”。
4. 预期结果：
   - HTTP 状态码为 403。
   - 页面后端决策显示 `blocked`。
   - 学习信号显示 `file-upload-validation-blocked`。
   - 页面不展示模拟存储路径。

## 验证 4：事件日志

完成漏洞版和修复版攻击样例后，检查后台输出或数据库 `lab_event_logs`：

- 漏洞版事件应为 `phase=attack`、`decision=accepted`。
- 修复版事件应为 `phase=defense`、`decision=blocked`。
- 两条记录都应属于 `labKey=web.file-upload`。
- `inputSummaryJson` 不应包含完整上传内容。

## 自动化入口

- 服务端测试：`apps/server/tests/file-upload-lab.test.ts`
- 前端 API 测试：`apps/web/tests/file-upload-api.test.ts`
- 前端模型测试：`apps/web/tests/file-upload-lab.test.ts`
- 脚本验证：`tools/lab-scripts/web/file-upload/verify.ts`
