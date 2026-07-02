# 依赖混淆手动验证

## 1. 当前 planned 验证

当前只验证目录、文档和元数据入口，不验证页面、API 或脚本。

应确认：

- `labs/supply-chain/dependency-confusion/meta.json` 存在。
- `status` 为 `planned`。
- `mode` 为 `simulation`。
- `entrypoints.docs` 只登记真实存在的文档入口。
- `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 均为空数组。
- `verification.automation.supported` 为 `false`。
- `variants[].supportsAutomation` 均为 `false`。
- `tools/lab-scripts/supply-chain/dependency-confusion/README.md` 存在。
- 当前不存在 `exploit.py` 或 `verify.ts`。

## 2. 安全边界验证

应确认文档明确禁止：

- 真实依赖安装、登录、下载、打包或发布命令。
- 真实 registry、镜像源或私有包服务连接。
- 真实投毒包、包归档、发布脚本或生命周期脚本。
- `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token、CI 凭据或真实依赖缓存读取。
- 完整 manifest、真实包名清单、真实 registry 地址、凭据、内部组织名或本机路径保存。

## 3. 后续实现验证预期

后续进入 API 和页面切片后，至少应验证：

- 漏洞版固定样例能观察错误来源选择。
- 修复版固定样例能观察 scope 绑定、来源审计或 lockfile 完整性阻断。
- 正常公开依赖样例仍可被接受。
- 未知 key 不回显、不读取真实配置、不连接真实 registry。
- 事件日志只保存固定 key、来源类别、风险标签、审计动作和学习信号。

## 4. 当前最小验证命令

```text
pnpm --filter @network-safe/shared test
pnpm --filter @network-safe/server test -- tests/health.test.ts tests/lab-registry.test.ts
```

并配合：

```text
git diff --check
rg -n "[ \t]+$" -- <本轮目标文件>
rg --files tools/lab-scripts/supply-chain/dependency-confusion labs/supply-chain/dependency-confusion
```

## 5. 禁止误判

当前 planned 阶段不能因为目录存在就标记为 ready。只有后续补齐受控 API、前端入口、统一事件日志、测试或只读验证脚本，并完成收口审计后，才能考虑推进状态。
