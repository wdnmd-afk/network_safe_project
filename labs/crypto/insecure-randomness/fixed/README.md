# 防御复盘版

防御复盘版使用同一固定摘要，提供两条受控路径：

- `detect-low-entropy-pattern` -> `block-weak-token-generation`：阻断弱随机来源，返回 `crypto-insecure-randomness-defense-blocked`。
- `detect-low-entropy-pattern` -> `verify-csprng-token-policy`：验证 `operating-system-csprng / 128-bit` 固定策略摘要，返回 `crypto-insecure-randomness-normal-verified`。

本版验证的是固定策略摘要，不调用随机 API，不生成、签发、保存或验证真实 token。
