# 手工验证矩阵

## 固定契约

- scenarioKey：`predictable-session-token-sequence`。
- 第一阶段 optionKey：`trust-timestamp-counter-pattern`、`detect-low-entropy-pattern`。
- 第二阶段 optionKey：`keep-predictable-token-source`、`block-weak-token-generation`、`verify-csprng-token-policy`。

## 路径一：漏洞版风险接受

1. 打开 `/labs/crypto/insecure-randomness/vuln`。
2. 选择 `trust-timestamp-counter-pattern`。
3. 选择 `keep-predictable-token-source`。
4. 预期 HTTP 200、decision 为 `accepted`、signal 为 `crypto-insecure-randomness-risk-accepted`。

## 路径二：修复版防御阻断

1. 打开 `/labs/crypto/insecure-randomness/fixed`。
2. 选择 `detect-low-entropy-pattern`。
3. 选择 `block-weak-token-generation`。
4. 预期 HTTP 403、decision 为 `blocked`、signal 为 `crypto-insecure-randomness-defense-blocked`。

## 路径三：修复版正常策略

1. 保持 `detect-low-entropy-pattern`。
2. 选择 `verify-csprng-token-policy`。
3. 预期 HTTP 200、decision 为 `accepted`、signal 为 `crypto-insecure-randomness-normal-verified`。

## 路径四：边界阻断

1. 提交未登记的 scenarioKey / optionKey、只提交第一阶段，或在终止步骤后追加多余决策。
2. 预期返回 `crypto-insecure-randomness-boundary-blocked` 或 `path-incomplete` 对应的脱敏阻断结果。
3. 响应与事件日志不得包含原始未知 key、token、secret、seed、时间戳、计数器、用户或原始随机材料。
