# 持久化风险观察步骤

> 本文档只描述固定教学数据上的风险观察路径，不提供任何可用于真实主机的持久化操作步骤。

## 观察目标

理解一个自启动条目在缺少签名校验、映像路径 ACL 收敛、受控触发窗口、最小权限账户和变更审计时，为什么会成为难以察觉的持久化落点。

## 固定风险条目

`virtual-unsigned-autorun-entry` 同时具备五项弱点：

1. `signatureScope: unsigned` — 发布者不可验证，替换映像文件不会触发签名告警。
2. `imagePathAclScope: user-writable` — 标准用户可写映像路径，无需提权即可替换被高权限账户执行的文件。
3. `triggerScope: logon-high-frequency` — 每次登录触发，重新获得执行机会的频率高。
4. `runAccountScope: high-privilege-account` — 以高权限账户运行，放大替换后的影响面。
5. `auditScope: none` — 缺少变更审计与告警，条目被新增或修改后无人知晓。

## 风险观察路径

1. 打开 `/labs/host/persistence-triage/vuln`。
2. 第一阶段 `persistence-scope-assessment` 选择 `accept-unsigned-autorun-entry`，即接受未签名、用户可写路径的条目继续保留。
3. 第二阶段 `persistence-disposition` 选择 `approve-persistence-retention`，即批准该条目继续驻留。
4. 观察服务端返回：`disposition` 为 `persistence-retention-approved`，学习信号为 `host-persistence-triage-risk-accepted`。
5. 观察固定审计摘要：4 项发现、2 项关键组合风险、0 项加固控制。

## 关键组合风险为什么是 2 项

关键风险只统计两类确定性组合，不是简单累加所有弱点：

- `未签名` 与 `用户可写映像路径` 同时成立：构成"无需提权即可替换高权限执行体"的完整链条。
- `标准用户可篡改` 为真：说明该条目的防篡改边界整体失效。

## 本实验不做的事

- 不创建、修改、删除或查询任何真实计划任务、注册表启动项、服务或自启动配置。
- 不读取真实主机的映像路径、文件 ACL、账户、SID 或事件日志。
- 不生成可导入真实系统的计划任务 XML、注册表脚本或持久化载荷。
- 不提供 `exploit.py`，也不提供任何攻击脚本或查询脚本。
- 不输出可直接迁移到真实环境的持久化操作命令。

## 下一步

切换到 `/labs/host/persistence-triage/fixed`，对比五项加固控制如何改变同一份固定条目的研判结论，并确认受控自启基线仍可正常通过复核。
