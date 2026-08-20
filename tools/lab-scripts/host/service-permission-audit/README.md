# 服务权限审计只读验证

## 用途

对 `host.service-permission-audit` 做本机只读一致性验证，覆盖元数据结构、固定虚构服务配置、权限计数、前后端专用路由顺序、分类注册、canonical 信号、文档完整性和禁用能力。

## 运行方式

```bash
pnpm --filter @network-safe/server exec tsx ../../tools/lab-scripts/host/service-permission-audit/verify.ts
```

必须从 `@network-safe/server` 工作区运行，因为脚本复用服务端固定配置常量，需要该工作区解析 `@network-safe/shared` 依赖。

## 安全边界

- 只读取仓库内元数据、文档、实现和测试文件，并导入服务端固定配置常量。
- 不发起 HTTP 请求，不连接主机、服务控制管理器、注册表、WMI 或外部目标。
- 不执行 PowerShell、`sc.exe`、系统命令、服务修改或 ACL 变更。
- 不提供 `exploit.py`，不生成服务替换步骤或提权脚本。
- 权限计数只由固定虚构配置的语义枚举确定性推导。
