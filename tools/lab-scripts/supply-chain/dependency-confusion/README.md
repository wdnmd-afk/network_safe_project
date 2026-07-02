# 依赖混淆脚本目录

## 当前状态

当前目录只用于 `supply-chain/dependency-confusion` 的脚本边界说明。

`supply-chain/dependency-confusion` 当前为 `in-progress`，已登记文档入口和后端受控 API 入口，但不登记脚本入口。这里的 in-progress 不表示存在攻击脚本、验证脚本、安装流程或发布流程。

当前不提供：

- `exploit.py`
- `verify.ts`
- 安装脚本
- 发布脚本
- registry 登录脚本
- 包归档生成脚本
- 生命周期脚本

## 后续允许方向

后续如需新增脚本，只允许先新增只读一致性验证：

- 读取仓库内元数据和文档。
- 检查固定样例 key 和安全边界说明。
- 检查不存在 `exploit.py`、安装命令、发布命令、registry 连接和凭据读取。

## 禁止能力

- 不运行真实依赖安装、登录、下载、打包或发布命令。
- 不请求真实 npm、pnpm、PyPI、Maven、私有 registry 或镜像源。
- 不读取 `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token、CI 凭据或真实依赖缓存。
- 不生成包归档、生命周期脚本、投毒样例或可运行包内容。
- 不写入 `node_modules`、全局包目录、依赖缓存或真实项目 manifest。
- 不扩展成通用供应链攻击工具。

后续如需新增任何脚本，必须单独编写执行文档，并且不得突破当前安全边界。
