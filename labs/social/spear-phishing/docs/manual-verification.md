# 鱼叉式钓鱼手动验证

## 1. 当前验证目标

当前切片验证 `social/spear-phishing` planned 元数据、文档入口、目录结构和安全边界是否一致。

本轮不验证页面、API、事件日志、脚本或自动化测试，因为这些能力尚未实现。

## 2. 元数据检查

确认 `labs/social/spear-phishing/meta.json` 满足：

- `id` 为 `social.spear-phishing`。
- `category` 为 `social`。
- `subcategory` 为 `spear-phishing`。
- `mode` 为 `case-study`。
- `status` 为 `planned`。
- `entrypoints.web` 为空数组。
- `entrypoints.api` 为空数组。
- `entrypoints.scripts` 为空数组。
- `entrypoints.docs` 只指向真实存在的文档入口，并包含 `labs/social/spear-phishing/docs/fixed-cases.md`。
- `verification.manual.supported` 为 `true`。
- `verification.manual.stepsDocPath` 为 `labs/social/spear-phishing/docs/manual-verification.md`。
- `verification.automation.supported` 为 `false`。
- 两个 `variants[].supportsAutomation` 均为 `false`。
- `safeBoundaries` 明确不提供真实画像采集、真实投递、凭据收集、模板生成、第三方平台调用或攻击脚本。

## 3. 文档检查

确认以下文件存在：

- `labs/social/spear-phishing/README.md`
- `labs/social/spear-phishing/vuln/README.md`
- `labs/social/spear-phishing/fixed/README.md`
- `labs/social/spear-phishing/mock/README.md`
- `labs/social/spear-phishing/docs/fixed-cases.md`
- `labs/social/spear-phishing/docs/attack-steps.md`
- `labs/social/spear-phishing/docs/fix-notes.md`
- `labs/social/spear-phishing/docs/manual-verification.md`
- `tools/lab-scripts/social/spear-phishing/README.md`

## 4. 边界检查

确认当前不存在：

- `tools/lab-scripts/social/spear-phishing/exploit.py`
- `tools/lab-scripts/social/spear-phishing/verify.ts`
- 鱼叉式钓鱼前端页面。
- 鱼叉式钓鱼后端 API。
- 真实投递、画像采集、凭据收集、模板生成或第三方平台调用实现。

确认当前文档：

- 只使用固定虚构案例方向。
- 固定案例文档只包含案例 key、虚构角色标签、误判线索、防御动作和学习信号。
- 不提供完整邮件正文、完整 IM 对话、可复制标题、可投递附件名或真实链接。
- 不要求用户输入真实姓名、邮箱、手机号、公司、部门、职位、社交账号、组织关系或公开资料。

## 5. 建议命令

```bash
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts
git diff --check -- <本轮目标文件>
rg -n "[ \t]+$" -- <本轮目标文件>
rg --files labs/social/spear-phishing tools/lab-scripts/social/spear-phishing
```

## 6. 通过标准

- 共享元数据校验通过。
- 服务端实验索引能扫描到 `social.spear-phishing`，状态为 `planned`。
- 本地元数据总数同步更新。
- 元数据只登记 docs 入口。
- 脚本目录只包含 README。
- 当前没有 `exploit.py`、`verify.ts`、真实投递、画像采集、凭据收集、模板生成或第三方平台调用能力。
