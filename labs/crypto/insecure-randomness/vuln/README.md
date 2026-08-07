# 风险观察版

风险观察版使用固定路径：

1. `trust-timestamp-counter-pattern`：把时间戳/自增结构误当作不可预测 token。
2. `keep-predictable-token-source`：继续接受固定弱随机来源摘要。

终止信号为 `crypto-insecure-randomness-risk-accepted`。该结果只表示固定策略判定存在低熵风险，不生成真实 token，也不提供序列预测或会话接管能力。
