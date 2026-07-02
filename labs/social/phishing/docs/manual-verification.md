# 网络钓鱼识别手动验证

## 1. 当前验证目标

当前切片只验证 planned 元数据、文档入口和安全边界是否一致，不验证页面、API、数据库日志或脚本执行。

## 2. 元数据检查

确认 `labs/social/phishing/meta.json` 满足：

- `id` 为 `social.phishing`。
- `category` 为 `social`。
- `subcategory` 为 `phishing`。
- `mode` 为 `case-study`。
- `status` 为 `planned`。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- `entrypoints.docs` 指向真实存在的文档。
- `verification.manual.supported` 为 `true`。
- `verification.automation.supported` 为 `false`。
- 两个 `variants[].supportsAutomation` 均为 `false`。

## 3. 文档检查

确认以下文件存在：

- `labs/social/phishing/README.md`
- `labs/social/phishing/vuln/README.md`
- `labs/social/phishing/fixed/README.md`
- `labs/social/phishing/mock/README.md`
- `labs/social/phishing/docs/attack-steps.md`
- `labs/social/phishing/docs/fix-notes.md`
- `labs/social/phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/phishing/README.md`

## 4. 边界检查

确认当前不存在：

- `tools/lab-scripts/social/phishing/exploit.py`
- `tools/lab-scripts/social/phishing/verify.ts`
- 前端网络钓鱼页面路由。
- 后端网络钓鱼 `review` API。
- 邮件发送、短信发送、消息投递、凭据收集或模板生成代码。

## 5. 建议命令

```bash
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts
git diff --check -- labs/social/phishing tools/lab-scripts/social/phishing docs/execution/2026-07-02-social-phishing-directory-metadata.md
rg -n "[ \t]+$" -- labs/social/phishing tools/lab-scripts/social/phishing docs/execution/2026-07-02-social-phishing-directory-metadata.md
```

## 6. 通过标准

- 共享元数据校验通过。
- 服务端实验索引能扫描到 `social.phishing`，总数同步增加。
- 安全关键词扫描只命中禁止性说明、边界约束或字段名。
- 当前目录中没有攻击脚本、真实投递能力、凭据收集能力或第三方平台调用。

