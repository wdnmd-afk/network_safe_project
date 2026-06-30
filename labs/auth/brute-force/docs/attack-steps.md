# 暴力破解攻击步骤

## 前置条件

- 本机后端服务已启动。
- 已通过平台演示账号登录，页面或脚本持有本机登录 token。
- 只访问 `localhost` 或 `127.0.0.1`。

## 页面步骤

1. 打开 `/labs/auth/brute-force/vuln`。
2. 点击“连续猜测样例”。
3. 提交候选口令。
4. 观察后端决策、学习信号和候选检查摘要。
5. 预期出现 `brute-force-password-guessed`。
6. 切换到 `/labs/auth/brute-force/fixed`。
7. 使用同一组连续猜测样例再次提交。
8. 预期出现 `brute-force-rate-limit-blocked`。

## 攻击者视角

攻击者并不知道真实口令，只能连续尝试候选口令。漏洞版的问题不在于某个候选值本身，而在于系统没有失败阈值，导致连续失败后仍继续检查后续候选口令。

## 日志观察

重点查看事件日志摘要中的：

- `candidateCount`
- `matchedAttemptNumber`
- `failedAttemptsBeforeMatch`
- `thresholdExceeded`
- `rateLimitApplied`
- `signal`

日志不应出现候选口令明文。

## 安全边界

不要把本实验脚本改造成字典枚举、并发爆破、多目标扫描或外部系统测试工具。
