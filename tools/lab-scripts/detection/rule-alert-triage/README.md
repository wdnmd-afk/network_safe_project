# 检测规则与告警研判实验脚本

## 只读验证

`verify.ts` 只读取仓库内固定安全事件数据、元数据、文档、前后端入口和测试文件，输出 JSON 一致性报告。

运行：

`pnpm --filter @network-safe/web exec tsx ../../tools/lab-scripts/detection/rule-alert-triage/verify.ts`

本实验不提供 `exploit.py`。规则画像只引用固定 `eventId`，不接收或执行 Sigma、YARA、正则、SQL、KQL、SPL 或其他查询表达式。

禁止将本目录扩展为真实日志采集、SIEM/EDR 接入、外部查询、主机探测、规则执行、隔离封禁或通用攻击工具。
