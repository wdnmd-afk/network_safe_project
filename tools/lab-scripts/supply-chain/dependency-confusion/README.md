# 依赖混淆脚本目录

## 当前状态

当前目录只用于 `supply-chain/dependency-confusion` 的脚本边界说明。

`supply-chain/dependency-confusion` 当前为 `ready`，已登记文档入口、前端固定选择器工作台、后端受控 API 入口、Playwright 页面级差异验证证据和本机只读一致性验证脚本，并已完成 simulation ready 收口审计。这里的 ready 只表示本项目内固定样例学习闭环完成，不表示存在攻击脚本、安装流程、真实 registry 连接或发布流程。

当前不提供：

- `exploit.py`
- 安装脚本
- 发布脚本
- registry 登录脚本
- 包归档生成脚本
- 生命周期脚本

Playwright 页面级验证位于 `packages/testing/tests/e2e/platform.spec.mjs`，只通过浏览器点击固定页面按钮观察本机受控 API 结果，不属于本目录脚本能力。

当前只提供：

- `verify.ts`：本机只读一致性验证脚本，只读取仓库内元数据、文档、前端、后端和测试文件，并输出 JSON 报告。

## 当前只读验证范围

`verify.ts` 只允许：

- 读取仓库内元数据和文档。
- 检查固定样例 key 和安全边界说明。
- 检查不存在 `exploit.py`、安装命令、发布命令、registry 连接和凭据读取。
- 检查前端 API client 只提交固定 `manifestKey`、`registryScenarioKey` 和 `resolutionPolicyKey`。
- 检查 Playwright 页面验证仍断言没有文本输入框。

## 禁止能力

- 不运行真实依赖安装、登录、下载、打包或发布命令。
- 不请求真实 npm、pnpm、PyPI、Maven、私有 registry 或镜像源。
- 不读取 `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token、CI 凭据或真实依赖缓存。
- 不生成包归档、生命周期脚本、投毒样例或可运行包内容。
- 不写入 `node_modules`、全局包目录、依赖缓存或真实项目 manifest。
- 不扩展成通用供应链攻击工具。

后续如需新增任何非只读脚本，必须单独编写执行文档，并且不得突破当前安全边界。
