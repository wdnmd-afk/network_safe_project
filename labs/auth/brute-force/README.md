# 暴力破解

## 实验目标

本实验演示登录口令暴力破解的核心风险：攻击者从目标账号出发，连续提交候选口令。如果接口没有失败次数阈值和节流，候选列表中只要包含正确口令，就可能在受控教学模型中被猜中。

本项目只使用虚拟教学账号 `training-user`，不调用真实平台登录接口，不读取真实密码，不保存候选口令明文。

## 实验入口

- 漏洞版页面：`/labs/auth/brute-force/vuln`
- 修复版页面：`/labs/auth/brute-force/fixed`
- 漏洞版 API：`POST /api/labs/auth/brute-force/vuln/attempt`
- 修复版 API：`POST /api/labs/auth/brute-force/fixed/attempt`

## 请求字段

```json
{
  "targetUsername": "training-user",
  "passwordCandidates": ["training-login-weak"]
}
```

- `targetUsername`：虚拟教学账号，固定样例为 `training-user`。
- `passwordCandidates`：候选口令列表，最多 5 个，只用于本机教学观察。

## 正常样例

```json
{
  "targetUsername": "training-user",
  "passwordCandidates": ["training-login-weak"]
}
```

两个变体都应返回：

```text
brute-force-normal-login-accepted
```

## 攻击样例

```json
{
  "targetUsername": "training-user",
  "passwordCandidates": [
    "summer2024",
    "password123",
    "letmein",
    "training-login-weak"
  ]
}
```

漏洞版没有失败阈值，会一直检查到第 4 个候选口令，预期信号为：

```text
brute-force-password-guessed
```

修复版在连续 3 次失败后触发节流，停止继续检查后续候选口令，预期信号为：

```text
brute-force-rate-limit-blocked
```

## 日志说明

接口会写入统一实验事件日志，日志只保存：

- 目标用户名长度和脱敏预览
- 候选口令数量
- 最大候选数量
- 匹配发生在第几次尝试
- 匹配前失败次数
- 是否超过阈值
- 是否应用节流
- 是否接受凭据
- 学习信号

日志不会保存候选口令明文、真实密码、真实 token 或外部目标信息。

## 文档

- `docs/attack-steps.md`：攻击步骤
- `docs/fix-notes.md`：修复说明
- `docs/manual-verification.md`：手动验证说明
