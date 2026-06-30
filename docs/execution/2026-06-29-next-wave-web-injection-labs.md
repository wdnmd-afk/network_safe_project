# 下一批 Web 注入类扩展实验设计执行文档

## 1. 目标

完成下一批扩展实验的设计切片，为后续依次实现 `web/command-injection`、`web/ssti`、`web/xxe` 提供可追溯的范围、顺序、安全边界和验证口径。

本轮只做设计文档，不新增实验代码、不修改接口、不调整数据库结构。

## 2. 范围

本轮覆盖：

- 确认下一批扩展实验优先选择命令注入、SSTI、XXE。
- 明确三类实验的业务包装、漏洞版 / 修复版差异、预期学习信号和日志边界。
- 明确三类实验必须复用通用详情页、统一事件日志、复盘卡片和脚本目录结构。
- 明确实现顺序与每个实验后续落地文件。
- 同步 `docs/TODO.md` 和 `docs/execution/security-lab-master-goal.md`。

本轮不覆盖：

- 不实现命令注入、SSTI 或 XXE 的前端页面。
- 不实现后端 service 或 API。
- 不新增攻击脚本。
- 不新增迁移或场景数据表。
- 不提供可用于外部真实目标的通用攻击 payload 或工具。

## 3. 已确认上下文

本轮实施前已确认以下来源：

- `AGENTS.md`
  - 本项目不是通用攻击工具库。
  - 脚本仅服务本机受控学习场景。
  - 每个实验应遵循 `labs/<category>/<scene>/` 与 `tools/lab-scripts/<category>/<scene>/` 结构。
- `docs/design/project-scope-and-security-content.md`
  - SQL 注入、命令注入、SSTI、XXE 优先做真实交互实验。
  - 高风险或不适合真实复现的问题应采用模拟、案例化或受控请求。
- `docs/design/phase-1-lab-list.md`
  - 命令注入、SSTI、XXE 属于一期实验清单。
  - 命令注入优先级高，SSTI 和 XXE 优先级中。
- `labs/web/command-injection/meta.json`
- `labs/web/ssti/meta.json`
- `labs/web/xxe/meta.json`
  - 三个实验目前均为占位状态，目录和基础元数据已存在。
- `labs/web/sql-injection/meta.json` 与 `labs/web/ssrf/meta.json`
  - 已有成熟实验提供了元数据、入口、脚本、验证和 `safeBoundaries` 的参考模式。
- `docs/design/lab-detail-reuse-pattern.md`
  - 新增实验必须通过 `variant.entryKey -> entrypoints.web[].key` 接入详情页。
  - 后端受控接口必须写入统一实验事件日志。

## 4. 操作步骤

1. 预读项目规则、项目范围文档、一期实验清单和 TODO 中的安全内容覆盖状态。
2. 预读命令注入、SSTI、XXE 当前占位元数据。
3. 预读 SQL 注入、SSRF 成熟实验元数据，提取可复用落地模式。
4. 新增下一批 Web 注入类实验设计文档。
5. 更新 TODO 顶部最新进展与安全内容覆盖表。
6. 更新主目标文档顶部最新进展与下一步建议。
7. 执行文档级最小验证。

## 5. 实施建议

- 后续实现应按命令注入、SSTI、XXE 的顺序逐项推进，每个实验单独写执行文档。
- 命令注入必须使用虚拟命令运行器，不允许调用真实 shell、`child_process` 或系统命令。
- SSTI 必须使用教学用模板模拟器，不允许使用 `eval`、`Function` 或真实服务端模板引擎危险配置。
- XXE 必须使用虚拟 XML 资源解析，不允许读取真实本机文件或访问真实网络。
- 三个实验都应写入 `lab_event_logs`，但日志只记录学习信号、检测结果和脱敏摘要。

## 6. 潜在风险分析

- **能力外溢风险**：命令注入、SSTI、XXE 都容易被误写成真实攻击能力，因此设计中必须先固定虚拟资源与受控信号。
- **脚本误用风险**：后续脚本必须默认限制 localhost，且不能扫描、探测或访问外部目标。
- **日志泄露风险**：不能把真实命令、真实模板表达式、真实 XML 文档或外部实体内容完整写入日志。
- **实现膨胀风险**：三个实验都属于注入类，但业务包装不同，应逐个实现，避免一次性大改多个前后端页面。
- **详情页接入风险**：必须补齐 `entrypoints.web`、`entrypoints.api`、`entrypoints.scripts` 和验证字段，不允许靠路由猜测接入。

## 7. 优化方案

- 后续可先实现命令注入，复用其页面结构和日志面板，再复制模式到 SSTI 与 XXE。
- 后续可补一个注入类通用工作台 helper，但必须等至少两个实验出现真实重复逻辑后再抽象。
- 后续可为三类实验统一定义“受控样例按钮”，避免页面暴露任意攻击输入。
- 后续可在元数据测试中增加 `safeBoundaries` 与 `entrypoints` 完整性检查。

## 8. 验证方式

本轮为文档设计切片，最小验证为：

- `git diff --check -- docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-next-wave-web-injection-labs.md docs/design/next-wave-web-injection-labs.md`
- `rg -n "[ \t]+$" docs/TODO.md docs/execution/security-lab-master-goal.md docs/execution/2026-06-29-next-wave-web-injection-labs.md docs/design/next-wave-web-injection-labs.md`

代码未修改，因此不运行前端、后端测试或全量构建。

