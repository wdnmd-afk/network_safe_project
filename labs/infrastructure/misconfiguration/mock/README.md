# 固定配置样例说明

## 当前状态

当前为 `in-progress` 阶段，已实现后端固定配置审计服务，尚未实现前端工作台。

本目录只记录固定样例方向，不保存真实配置文件、真实服务地址、真实端口、真实凭据或本机路径。

## 固定配置样例

后端 API 当前使用固定 key：

| `configCaseKey` | 观察点 | 漏洞版信号 | 修复版信号 |
|---|---|---|---|
| `debug-console-exposed` | 调试入口开启 | 调试面可见 | 默认关闭或仅内部可见 |
| `directory-index-enabled` | 目录索引开启 | 文件列表暴露 | 禁用目录索引 |
| `wildcard-cors-with-credentials` | CORS 过宽 | 跨域信任边界模糊 | 可信来源白名单 |
| `public-admin-status` | 管理状态页公开 | 内部状态外显 | 认证和来源限制 |
| `verbose-error-detail` | 错误信息过细 | 技术栈或路径线索外显 | 用户提示和内部日志分离 |
| `default-credential-hint-visible` | 默认凭据提示 | 存在弱口令线索 | 移除提示并强化初始化流程 |

## 固定审计策略

后端 API 当前使用固定 key：

- `exposure-review`
- `least-exposure-policy`
- `authenticated-admin-only`
- `strict-cors-audit`
- `safe-error-reporting`

## 禁止内容

mock 数据不得包含：

- 真实 nginx、MySQL、Node、系统服务或云账号配置。
- 真实 `.env`、数据库连接串、服务路径、证书、token、Cookie、账号或密码。
- 真实主机、IP、域名、端口、URL、云资源 ID 或本机路径。
- 可复制到真实环境的配置修改命令。
