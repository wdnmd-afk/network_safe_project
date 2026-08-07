# 不安全随机数与 token 熵

## 场景目标

通过固定 token 模式摘要，观察把时间戳/自增结构误当作随机熵与采用操作系统 CSPRNG 策略后的判定差异。

本实验只使用固定案例 `predictable-session-token-sequence`。风险摘要登记 `timestamp-counter`、低熵和单调模式；正常策略摘要登记 `operating-system-csprng / 128-bit`。页面、API 和事件日志都不包含可用的真实 token、secret、seed、时间戳、计数器或用户信息。

当前已按 LT-023 完成专用两步模拟链路（熵与模式判定 -> 随机源处置），评估请求只接受固定 `scenarioKey` 和有序 `decisions`。元数据为 `ready`，仅表示本机固定摘要学习闭环已通过验证。

## 固定决策

- 第一阶段：`trust-timestamp-counter-pattern` 或 `detect-low-entropy-pattern`。
- 第二阶段：`keep-predictable-token-source`、`block-weak-token-generation` 或 `verify-csprng-token-policy`。
- 风险信号：`crypto-insecure-randomness-risk-accepted`。
- 防御信号：`crypto-insecure-randomness-defense-blocked`。
- 正常信号：`crypto-insecure-randomness-normal-verified`。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要外部目标、真实凭据、认证数据库、随机源或第三方服务。

## 使用方式

1. 访问 `/labs/crypto/insecure-randomness/vuln`。
2. 载入推荐路径，观察时间戳/自增模式被误信任后弱随机来源继续被接受。
3. 切换到 `/labs/crypto/insecure-randomness/fixed`，观察低熵模式被识别并阻断。
4. 载入正常随机源策略，验证固定 CSPRNG 策略摘要仍可通过。
5. 在实验详情或账户中心复盘统一事件日志的安全摘要。

## 安全边界

- 页面和 API 只接受本实验声明的 scenarioKey 与决策 optionKey。
- 不接受或生成 token、secret、seed、时间戳、计数器、用户、熵值或自由文本。
- 未知 key 会被脱敏阻断，不回显原始输入，也不写入事件日志。
- 本实验不提供 `exploit.py`、序列预测、枚举、爆破、会话接管或认证链路变更能力。
- 现有会话实现是 HMAC 签名结构；本实验只讨论随机材料策略，不把签名完整性与随机熵混为一谈。
