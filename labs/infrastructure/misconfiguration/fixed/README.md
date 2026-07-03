# 配置审计复盘版

## 定位

配置审计复盘版用于从防御方视角理解如何收敛配置暴露面。

当前处于 `ready` 阶段，前端固定配置审计工作台、后端受控 `audit` API、Playwright 页面级差异验证和本机只读一致性验证已覆盖修复版固定配置审计信号。本目录仍不包含真实配置修改、部署步骤或攻击脚本。

## 固定修复目标

修复版只允许基于固定静态配置摘要展示：

- 默认关闭调试入口、目录索引和公开状态页。
- 管理入口需要认证、授权和来源限制。
- CORS 只允许明确可信来源、方法和头部。
- 用户错误信息和内部日志分层。
- 配置变更需要审计清单和上线前检查。

## 预期学习信号

可观察信号包括：

- `misconfiguration-exposure-reduced`
- `misconfiguration-auth-required`
- `misconfiguration-cors-policy-restricted`
- `misconfiguration-safe-error-reporting`
- `misconfiguration-boundary-verified`

## 当前入口

```text
GET /labs/infrastructure/misconfiguration/fixed
POST /api/labs/infrastructure/misconfiguration/fixed/audit
```

页面和请求体只读取固定字段：

- `configCaseKey`
- `auditPolicyKey`

修复版可观察暴露面收敛、管理入口认证要求、CORS 策略收敛和安全错误信息等结果；事件日志仍只记录固定摘要。

脚本入口只提供本机只读一致性验证：

- `tools/lab-scripts/infrastructure/misconfiguration/verify.ts`

## 禁止内容

- 不修改真实 nginx、MySQL、Node、Windows 服务或云账号配置。
- 不提供真实配置重载、部署、回滚或系统命令。
- 不读取 `.env`、服务配置、数据库连接串、云凭据、token、Cookie 或密码。
- 不把修复版做成真实配置管理器。
