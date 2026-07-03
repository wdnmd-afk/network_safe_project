# 配置错误利用

## 场景目标

本实验用于学习基础设施和应用部署中的配置错误风险：调试入口、目录索引、过宽 CORS、公开管理状态页、详细错误信息和默认凭据提示，都可能让攻击方推断服务边界、内部状态或后续攻击机会。

当前状态为 `ready`，已完成标准目录、元数据、基础文档入口、前端固定配置审计工作台、后端受控 `audit` API、Playwright 页面级差异验证和本机只读一致性验证的 simulation ready 收口审计。这里的 ready 只表示本项目内固定静态配置片段学习闭环完成，不表示已经存在扫描器、真实配置审计能力或攻击脚本。

## 当前范围

- 已建立 `infrastructure.misconfiguration` 元数据。
- 已建立漏洞版 / 修复版说明目录。
- 已建立攻击方观察、修复说明和手动验证文档。
- 已建立脚本目录边界说明。
- 已建立 `POST /api/labs/infrastructure/misconfiguration/:variant/audit` 后端受控接口。
- 已建立 `/labs/infrastructure/misconfiguration/vuln` 与 `/labs/infrastructure/misconfiguration/fixed` 前端固定选择器工作台。
- 已建立 `packages/testing/tests/e2e/platform.spec.mjs` 页面级差异验证，覆盖漏洞版固定暴露信号和修复版固定审计路径。
- 已建立 `tools/lab-scripts/infrastructure/misconfiguration/verify.ts` 本机只读一致性验证脚本。
- 已完成 simulation ready 收口审计：`docs/execution/2026-07-03-infrastructure-misconfiguration-ready-closeout.md`。
- 元数据当前登记 docs、web、api 和 scripts 入口。
- scripts 入口只登记 `misconfiguration-verify` 只读一致性验证。
- 当前不创建 `exploit.py`。

## 固定样例方向

后续只允许固定 key：

- `debug-console-exposed`：观察调试入口开启带来的暴露面风险。
- `directory-index-enabled`：观察目录索引开启导致的文件列表暴露风险。
- `wildcard-cors-with-credentials`：观察过宽 CORS 对浏览器信任边界的影响。
- `public-admin-status`：观察公开管理状态页造成的内部状态泄露风险。
- `verbose-error-detail`：观察详细错误信息外显带来的技术栈和路径线索。
- `default-credential-hint-visible`：观察默认凭据提示可见这一风险信号，但不展示任何真实账号或密码。

固定审计策略：

- `exposure-review`：漏洞版教学策略，展示暴露面扩大后的风险信号。
- `least-exposure-policy`：修复版教学策略，展示默认关闭和最小暴露面。
- `authenticated-admin-only`：修复版教学策略，展示管理入口认证、授权和来源限制。
- `strict-cors-audit`：修复版教学策略，展示可信来源、方法和凭据策略收敛。
- `safe-error-reporting`：修复版教学策略，展示用户错误信息和内部日志分离。

这些样例只作为学习标签、后续 API 固定 key 和风险说明使用，不读取或修改真实服务配置。

## 当前入口状态

当前存在文档入口、前端固定工作台入口和后端 API 入口：

- `labs/infrastructure/misconfiguration/meta.json`
- `labs/infrastructure/misconfiguration/README.md`
- `labs/infrastructure/misconfiguration/docs/attack-steps.md`
- `labs/infrastructure/misconfiguration/docs/fix-notes.md`
- `labs/infrastructure/misconfiguration/docs/manual-verification.md`
- `tools/lab-scripts/infrastructure/misconfiguration/README.md`
- `tools/lab-scripts/infrastructure/misconfiguration/verify.ts`
- `/labs/infrastructure/misconfiguration/vuln`
- `/labs/infrastructure/misconfiguration/fixed`
- `POST /api/labs/infrastructure/misconfiguration/vuln/audit`
- `POST /api/labs/infrastructure/misconfiguration/fixed/audit`

当前没有：

- `tools/lab-scripts/infrastructure/misconfiguration/exploit.py`

## 安全边界

- 不修改真实 `nginx`、MySQL、Node、Windows 服务、系统防火墙、代理、hosts、证书或云账号配置。
- 不读取真实 `.env`、本机配置文件、服务配置、云凭据、数据库连接串、token、Cookie 或密码。
- 不启动真实调试端口、管理端口、目录索引、公开状态页或跨域代理。
- 不扫描本机端口、局域网、外部 IP、域名、云资源或服务指纹。
- 不提供 `exploit.py`、扫描器、弱口令测试、服务枚举或可复用利用流程。

## 后续可扩展方向

1. 如需扩展更多基础设施配置案例，先新增单独执行文档。
2. 继续保持固定样例、受控 API、只读验证和不连接真实基础设施的边界。
