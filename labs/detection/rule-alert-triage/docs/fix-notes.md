# 修复说明

## 根因

单信号规则缺少上下文。过宽规则会把正常重试视为告警，过窄规则会遗漏认证与网络证据；如果研判阶段再把关联告警直接当作噪声关闭，可疑时间线就不会进入处置。

## 固定修复策略

- 使用 `expectedDisposition` 作为固定教学基线，确定性计算 TP、FP、FN、准确率和召回率。
- 用 `correlated-auth-process-network-rule` 关联认证、进程和网络固定事件，同时排除维护任务与单次重试。
- 多源可疑证据返回 `detection-rule-alert-triage-defense-escalated`。
- 维护窗口与签名任务证据返回 `detection-rule-alert-triage-normal-verified`。
- 未登记 scenarioKey / optionKey、不完整路径和终止后追加决策统一脱敏阻断。
- 事件日志只记录固定 key、TP/FP/FN、步数、终止结果和 signal。

本实验不解析或执行 Sigma、YARA、正则、SQL、KQL、SPL，也不执行真实处置。
