# 阶段 B：文件上传漏洞纵向实验执行文档

## 1. 目标

按 `docs/execution/security-lab-master-goal.md` 的阶段 B 优先级，落地 `web.file-upload` 纵向实验。实验从攻击方视角展示“上传入口只看表单是否提交成功，不校验文件扩展名、MIME 与内容特征”时，攻击者如何把伪装文件放入公开目录；再通过修复版理解扩展名白名单、内容特征检查、隔离存储和日志审计的作用。

本实验完成后应具备：

- 正常图片上传流程。
- 漏洞版上传接口与页面。
- 修复版上传接口与页面。
- 受控攻击样例与成功 / 阻断信号。
- 后端控制台结构化日志。
- `lab_event_logs` 数据库实验事件日志。
- 本机受控脚本与验证配置。
- API / 前端模型 / API client / 元数据测试。
- 实验文档、攻击步骤、修复说明和手动验证说明。

## 2. 范围

本次包含：

- 新增 `apps/server/src/services/file-upload-lab.ts`。
- 新增后端接口：
  - `POST /api/labs/web/file-upload/:variant/upload`
- 新增前端 API、实验模型、页面与路由：
  - `/labs/web/file-upload/vuln`
  - `/labs/web/file-upload/fixed`
- 更新 `labs/web/file-upload/meta.json` 和相关 README / docs。
- 新增 `tools/lab-scripts/web/file-upload/exploit.py` 与 `verify.ts`。
- 补充服务端、前端和元数据测试。
- 同步 `docs/TODO.md` 和主目标状态。

本次不包含：

- 真实 multipart 文件落盘。
- 把任意用户文件写入公开目录。
- 上传、保存或执行真实 web shell。
- 对外部目标进行文件投递。
- 绕过杀毒、解析器差异、图片马、压缩包炸弹等高风险内容。

## 3. 实验设计

### 3.1 正常业务

业务场景为“售后凭证上传”：

- 正常用户上传图片凭证，例如 `receipt.png`。
- 后端返回模拟存储路径、文件摘要和学习信号。
- 正常图片在漏洞版和修复版都应被接受。

### 3.2 漏洞版

漏洞版只做最小字段存在检查，不校验扩展名、MIME 与内容特征。

受控攻击样例：

```text
invoice.php
application/x-php
<?php echo "file-upload-lab"; ?>
```

预期观察：

- 漏洞版接受伪装脚本文件。
- 后端信号为 `file-upload-executable-stored`。
- 事件日志记录攻击阶段、攻击者视角、被接受的后端决策和风险摘要。

### 3.3 修复版

修复版采用以下检查：

- 扩展名只允许 `.png`、`.jpg`、`.jpeg`、`.webp`。
- MIME 只允许 `image/png`、`image/jpeg`、`image/webp`。
- 内容不能包含 PHP/JSP/ASP 等脚本特征。
- 模拟存储路径使用隔离目录，不直接暴露原始文件名。

同样攻击样例在修复版中应被阻断。

预期观察：

- 修复版返回 `403`。
- 后端信号为 `file-upload-validation-blocked`。
- 事件日志记录防御阶段和阻断原因摘要。

### 3.4 安全边界

- 请求体使用 JSON 模拟文件元数据和短文本内容，不接收真实二进制上传。
- 服务不写入磁盘，不生成可访问文件。
- 脚本默认只允许访问 `localhost` / `127.0.0.1`。
- 日志只保存文件名摘要、扩展名、MIME、内容长度和检测信号，不保存完整内容。

## 4. 操作步骤

1. 实现文件上传实验服务：
   - variant 校验。
   - 正常图片样例。
   - 漏洞版接受危险上传。
   - 修复版阻断危险上传。
   - 返回模拟存储路径、检测结果、教学信号和下一步提示。
2. 在 `createApp` 注入 `fileUploadLabService` 并新增上传接口。
3. 接口调用统一 `recordLabEvent` 写入控制台和数据库事件日志。
4. 新增前端 API client。
5. 新增前端实验模型与引导式页面。
6. 更新路由和元数据入口。
7. 补齐实验文档、攻击步骤、修复说明、手动验证说明。
8. 新增本机受控脚本和验证入口。
9. 补充测试并运行最小必要验证。
10. 更新 `docs/TODO.md` 和主目标阶段状态。

## 5. 实施建议

- API 响应保留 `inspection`，展示扩展名、MIME 和内容风险信号。
- 漏洞版接受危险文件时明确标记“攻击成功信号”。
- 修复版对攻击样例使用 403 和 `status: "blocked"`。
- 前端页面提供：
  - 正常图片样例按钮。
  - 攻击样例按钮。
  - 后端决策摘要。
  - 文件检查摘要。
  - 模拟存储路径。
  - 下一步观察提示。
- 文档必须说明真实生产还需要对象存储隔离、重命名、权限控制、病毒扫描和下载域隔离。

## 6. 潜在风险分析

- **真实可执行文件落地风险**：本实验不写入文件系统，仅返回模拟存储路径。
- **脚本误用风险**：脚本默认只面向本机，并拒绝外部 host。
- **日志敏感内容风险**：统一日志只保存摘要，不保存完整文件内容。
- **前端误导风险**：页面和文档必须明确“这是受控模拟，不是通用上传攻击工具”。
- **现有工作区改动较多**：只追加文件上传链路，不回滚已有阶段 A、CSRF、SQL 注入和详情页改动。

## 7. 验证方式

最小必要验证：

- `pnpm --filter @network-safe/server test`
- `pnpm --filter @network-safe/web exec vitest run`
- `pnpm --filter @network-safe/shared test`
- `pnpm --filter @network-safe/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --filter @network-safe/web exec vue-tsc -p tsconfig.json --noEmit`
- `python tools/lab-scripts/web/file-upload/exploit.py --help`
- `pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/file-upload/verify.ts`

可选验证：

- 后续补充 Playwright 闭环后再运行 `pnpm test:e2e`。

## 8. 完成记录

2026-06-25 已按本文档落地 `web.file-upload` 纵向实验：

- 新增后端受控模拟上传服务与 `POST /api/labs/web/file-upload/:variant/upload`。
- 漏洞版对受控可执行上传样例返回 `file-upload-executable-stored`。
- 修复版对同一上传样例返回 `file-upload-validation-blocked`。
- 普通图片样例在漏洞版和修复版均返回 `file-upload-normal-image-stored`。
- 上传动作已接入 `lab_event_logs`，仅记录摘要，不保存完整 `contentText`。
- 新增前端页面、API client、教学模型、路由入口与对应测试。
- 补齐场景元数据、实验文档、本机脚本和共享元数据校验。
- 阶段 B 下一项调整为 `web.path-traversal` 路径遍历实验。
