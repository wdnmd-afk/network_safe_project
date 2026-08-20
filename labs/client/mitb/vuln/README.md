# 风险观察版

风险观察版推荐固定路径：

1. `trust-browser-rendered-view`：只信任 `virtual-tampered-transfer-view` 的浏览器渲染字段。
2. `submit-transaction-from-browser-view`：按浏览器显示提交交易，不核对服务端记录与带外通道。

终止信号为 `client-mitb-risk-accepted`，固定计数为 4 项发现、3 项三方不一致、0 项受信路径控制。该结果只描述教学对照结论，不读取真实浏览器状态，也不发起任何支付或转账操作。
