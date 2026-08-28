# 自启持久化风险观察版

## 版本定位

本版本用于观察固定条目 `virtual-unsigned-autorun-entry` 在缺失签名校验、允许用户可写映像路径、登录高频触发、高权限运行账户且无变更审计时，可疑持久化被保留下来的固定结果。

## 固定条目

- 条目：`virtual-unsigned-autorun-entry`
- 签名范围：`unsigned`
- 映像路径 ACL：`user-writable`
- 触发器：`logon-high-frequency`
- 运行账户：`high-privilege-account`
- 变更审计：`none`
- 标准用户可篡改：是
- 固定审计计数：4 项发现、2 项关键组合风险、0 项加固控制

## 推荐路径

1. `accept-unsigned-autorun-entry`
2. `approve-persistence-retention`

完成后应返回 `host-persistence-triage-risk-accepted` 学习信号，处置结论为 `persistence-retention-approved`。

## 观察要点

- 未签名与用户可写路径同时成立时，标准用户即可替换开机自动执行的映像。
- 登录高频触发让替换后的映像获得稳定重复执行机会。
- 高权限运行账户把一次持久化写入放大为长期高权限驻留。
- 缺失变更审计使这次写入既无告警也无事后追溯。

## 安全边界

- 只读取服务端冻结的固定条目快照，不枚举或修改真实计划任务、启动项与注册表。
- 不读取真实主机 ACL、注册表、系统凭据或真实 Windows 事件日志。
- 不接受主机名、文件路径、任务名、账户或签名指纹等自由输入；未知 key 会被脱敏阻断。
- 本版本不提供 `exploit.py`，也不输出可直接用于真实主机的持久化创建步骤。
