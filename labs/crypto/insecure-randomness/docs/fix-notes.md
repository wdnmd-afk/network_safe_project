# 修复说明

## 根因

时间戳、自增计数器和其他可观察结构不能提供不可预测性。HMAC 可以保护已签名载荷的完整性，但签名结构与随机 token 的熵是不同问题，不能用其中一个替代另一个的安全评估。

## 固定修复策略

- 识别 `timestamp-counter` 摘要中的低熵、单调和自增模式。
- 对弱随机来源返回 `crypto-insecure-randomness-defense-blocked`。
- 随机 token 策略要求使用操作系统 CSPRNG 和至少 128 位随机材料。
- 对固定 `operating-system-csprng / 128-bit` 策略摘要返回 `crypto-insecure-randomness-normal-verified`。
- 未登记 scenarioKey / optionKey 统一脱敏阻断，不回显原始输入。
- 事件日志只记录固定决策摘要，不记录 token、secret、seed、时间戳、计数器、用户或原始随机材料。

本实验只模拟确定性策略判定，不修改现有会话服务，不生成、签发、存储或验证真实 token。
