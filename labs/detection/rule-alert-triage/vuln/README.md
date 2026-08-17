# 风险观察版

风险观察版推荐固定路径：

1. `trust-broad-single-signal-rule`：信任过宽认证失败规则，观察一条误报和三条漏报。
2. `dismiss-correlated-alert-as-noise`：把具有固定多源证据的关联告警错误关闭。

终止信号为 `detection-rule-alert-triage-risk-accepted`。也可选择过窄进程规则观察三条漏报。该结果只描述教学研判风险，不读取真实日志或关闭真实告警。
