# LDAP 注入脚本目录

## 当前状态

本目录只提供 `web/ldap-injection` 的本机只读一致性验证入口：

- `verify.ts`：读取本仓库内固定 LDAP 元数据和案例文档，确认前端工作台、虚拟目录 API、文档、安全边界和脚本入口保持一致。

当前不提供：

- `exploit.py`
- LDAP 查询脚本
- 外部目标验证脚本
- 过滤器 payload 库

## 使用方式

```powershell
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/web/ldap-injection/verify.ts
```

脚本输出结构化 JSON 报告。若任一一致性检查失败，脚本返回非零退出码。

## 验证范围

- `labs/web/ldap-injection/meta.json`
- `labs/web/ldap-injection/README.md`
- `labs/web/ldap-injection/vuln/README.md`
- `labs/web/ldap-injection/fixed/README.md`
- `labs/web/ldap-injection/mock/README.md`
- `labs/web/ldap-injection/docs/attack-steps.md`
- `labs/web/ldap-injection/docs/fix-notes.md`
- `labs/web/ldap-injection/docs/manual-verification.md`

脚本只检查前端工作台、API 元数据登记和文档边界，不向后端发送请求。

## 安全边界

- 只读取本仓库内固定文件。
- 不连接真实 LDAP / AD / OpenLDAP 服务。
- 不进行真实 bind、search、modify 或 delete 操作。
- 不请求外部目标。
- 不读取本机目录服务配置。
- 不保存目录账号、组织结构、DN、邮箱、手机号或凭据。
- 不生成过滤器 payload 库。
- 不实现任意 LDAP 过滤器执行器。
