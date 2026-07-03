# 配置错误利用脚本目录

## 当前状态

当前目录用于 `infrastructure/misconfiguration` 的脚本边界说明和本机只读一致性验证。

`infrastructure/misconfiguration` 当前为 `ready`，已登记文档入口、后端受控 API、前端固定工作台、Playwright 页面级差异验证、本机只读一致性验证、标准目录和元数据，并完成 simulation ready 收口审计；不提供攻击脚本、扫描脚本或配置修改脚本。

Playwright 页面级差异验证位于 `packages/testing/tests/e2e/platform.spec.mjs`，只访问本项目固定页面并点击固定样例按钮；它不属于本目录 scripts 自动化入口，也不提供真实配置读取、扫描、连接或修改能力。

本目录当前脚本：

- `verify.ts`：本机只读一致性验证脚本，只读取仓库内元数据、文档、前端、后端和测试文件，输出 JSON 报告。

当前不提供：

- `exploit.py`
- 端口扫描脚本
- 服务枚举脚本
- 弱口令测试脚本
- 配置读取脚本
- 配置修改或重载脚本
- 云资源探测脚本

## 当前验证方式

运行方式：

```text
pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/infrastructure/misconfiguration/verify.ts
```

`verify.ts` 只做本机只读一致性验证：

- 读取仓库内元数据和文档。
- 检查固定样例 key、固定审计策略 key 和安全边界说明。
- 检查 web、api、docs、scripts 和自动化证据是否一致。
- 检查不存在 `exploit.py`、扫描器、真实配置读取、真实配置修改和真实管理接口连接。
- 输出 JSON 一致性报告。

## 禁止能力

- 不扫描端口、网段、服务、域名、云资源或本机进程。
- 不读取真实配置文件、`.env`、服务配置、系统配置、云凭据、token 或密码。
- 不修改、重载或启动真实 nginx、MySQL、Node、Windows 服务、代理、防火墙或云配置。
- 不请求外部目标或连接真实管理接口。
- 不生成扫描器、利用脚本、弱口令测试脚本、服务枚举脚本或配置修改脚本。
- 不扩展成通用基础设施攻击工具。

后续如需新增任何脚本，必须单独编写执行文档，并且不得突破当前安全边界。
