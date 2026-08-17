# 防御复盘版

防御复盘版使用同一固定时间线，先选择 `correlate-multi-source-signals`，再对比两条研判路径：

- `escalate-correlated-alert-for-containment`：确认四条跨来源可疑证据，返回 `detection-rule-alert-triage-defense-escalated`。
- `close-known-maintenance-with-evidence`：依据维护窗口与签名任务摘要，返回 `detection-rule-alert-triage-normal-verified`。

两条路径都只生成固定教学结论，不执行真实隔离、封禁、调查或告警关闭动作。
