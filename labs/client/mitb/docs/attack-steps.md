# 风险观察步骤

1. 登录本机学习平台并打开浏览器 MITB 风险观察版。
2. 确认固定 scenarioKey 为 `fixed-browser-transaction-view-audit`。
3. 第一阶段选择 `trust-browser-rendered-view`，观察 `virtual-tampered-transfer-view` 的 4 项发现与 3 项三方不一致。
4. 第二阶段选择 `submit-transaction-from-browser-view`。
5. 运行固定对照，确认服务端返回 `client-mitb-risk-accepted`。
6. 复盘事件摘要，只应看到固定案例 / 视图 key、三项计数、步数、终止结果和 signal。

该流程只读取服务端固定虚构交易视图，不提交真实账户、卡号、金额或收款方，不发起任何支付、转账或撤销调用，也不读取真实浏览器 DOM、扩展或凭据。本文档只描述"如何观察不一致结果"，不描述任何浏览器内篡改或注入手法。
