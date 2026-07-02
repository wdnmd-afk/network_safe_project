# 依赖混淆攻击方观察步骤

## 1. 观察目标

本文件只用于帮助学习者理解攻击方会关注哪些依赖解析风险信号，不提供真实包发布、真实安装、registry 登录、投毒包构造或生命周期脚本。

攻击方视角的核心问题是：哪些配置会让私有依赖和公共依赖之间的来源边界变得模糊。

## 2. 固定观察步骤

1. 选择固定 manifest 样例，例如 `unscoped-internal-name` 或 `mixed-source-review`。
2. 观察样例中是否缺少组织 scope、私有 registry 绑定或 lockfile 审计。
3. 选择固定伪 registry 场景，例如 `public-name-collision`。
4. 观察错误解析策略为什么可能偏向不可信来源。
5. 记录学习信号，例如 `dependency-confusion-public-source-selected` 或 `dependency-confusion-private-scope-missing`。
6. 切换到来源审计复盘版，观察 scope、lockfile 和完整性校验如何收敛风险。

## 3. 当前入口状态

当前已建立文档、元数据入口、前端固定选择器工作台和后端受控 `resolve` API：

- `labs/supply-chain/dependency-confusion/meta.json`
- `labs/supply-chain/dependency-confusion/README.md`
- `tools/lab-scripts/supply-chain/dependency-confusion/README.md`
- `/labs/supply-chain/dependency-confusion/vuln`
- `/labs/supply-chain/dependency-confusion/fixed`
- `POST /api/labs/supply-chain/dependency-confusion/:variant/resolve`

当前未实现：

- `exploit.py`。
- `verify.ts`。
- 真实安装、发布、下载或登录流程。

## 4. 成功观察信号

后续实现后，学习者应能说明：

- 为什么未使用 scope 的内部依赖名更容易产生来源混淆。
- 为什么固定私有 registry 和来源审计能降低风险。
- 为什么 lockfile 和完整性摘要可以帮助发现异常来源。
- 为什么日志只能记录固定 key 和来源类别，不能保存真实包名清单或凭据。

## 5. 明确禁止

- 不运行真实安装、登录、下载、打包或发布命令。
- 不请求真实 npm、pnpm、PyPI、Maven、私有 registry 或镜像源。
- 不创建真实投毒包、包归档、发布脚本或生命周期脚本。
- 不读取 `.npmrc`、`.yarnrc`、`.pypirc`、环境变量 token、CI 凭据或真实依赖缓存。
- 不输出可复用投毒流程或攻击脚本。
