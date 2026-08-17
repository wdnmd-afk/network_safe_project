# 风险观察步骤

1. 登录本机学习平台并打开检测规则与告警研判风险观察版。
2. 确认固定 scenarioKey 为 `fixed-auth-process-alert-timeline`。
3. 第一阶段选择 `trust-broad-single-signal-rule`，观察 TP=1、FP=1、FN=3。
4. 第二阶段选择 `dismiss-correlated-alert-as-noise`。
5. 运行固定研判，确认服务端返回 `detection-rule-alert-triage-risk-accepted`。
6. 复盘事件摘要，只应看到固定案例/规则 key、TP/FP/FN、步数、终止结果和 signal。

该流程不提交真实事件、规则、查询、主机、账号、IP、URL 或凭据，不连接外部系统，也不关闭真实告警。
