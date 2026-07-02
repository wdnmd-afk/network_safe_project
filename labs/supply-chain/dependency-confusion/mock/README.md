# 固定模拟数据说明

## 当前状态

当前目录只记录固定模拟数据的边界，不存放真实包、包归档、lockfile、registry 导出或依赖缓存。

## 当前固定样例

当前后端受控 `resolve` API 只使用以下固定 key：

- `unscoped-internal-name`
- `scoped-private-package`
- `mixed-source-review`
- `public-name-collision`
- `private-scope-pinned`
- `lockfile-integrity-mismatch`
- `prefer-public-latest`
- `scope-pinned-private`
- `lockfile-integrity-audit`

这些 key 只表示受控学习样例，不对应真实包生态中的包名、版本、组织或 registry 地址。

## 禁止内容

- 不存放真实 `package.json`、lockfile、`.npmrc`、`.yarnrc`、`.pypirc` 或 CI 配置。
- 不存放真实包归档、安装日志、发布日志或 registry 响应。
- 不存放 token、Cookie、用户名、密码、访问令牌或内部组织名。
- 不存放生命周期脚本、投毒样例或可运行包内容。
