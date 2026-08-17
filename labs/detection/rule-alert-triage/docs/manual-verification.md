# 手工验证矩阵

## 固定契约

- scenarioKey：`fixed-auth-process-alert-timeline`。
- 第一阶段 optionKey：`trust-broad-single-signal-rule`、`trust-narrow-single-signal-rule`、`correlate-multi-source-signals`。
- 第二阶段 optionKey：`dismiss-correlated-alert-as-noise`、`escalate-correlated-alert-for-containment`、`close-known-maintenance-with-evidence`。

## 路径一：漏洞版风险接受

1. 打开 `/labs/detection/rule-alert-triage/vuln`。
2. 选择 `trust-broad-single-signal-rule` 和 `dismiss-correlated-alert-as-noise`。
3. 预期 HTTP 200、decision 为 `accepted`、signal 为 `detection-rule-alert-triage-risk-accepted`。
4. 预期规则指标为 TP=1、FP=1、FN=3、准确率 50%、召回率 25%。

## 路径二：修复版防御升级

1. 打开 `/labs/detection/rule-alert-triage/fixed`。
2. 选择 `correlate-multi-source-signals` 和 `escalate-correlated-alert-for-containment`。
3. 预期 HTTP 403、decision 为 `blocked`、signal 为 `detection-rule-alert-triage-defense-escalated`。
4. 预期规则指标为 TP=4、FP=0、FN=0、准确率和召回率均为 100%。

## 路径三：修复版正常关闭

1. 保持 `correlate-multi-source-signals`。
2. 选择 `close-known-maintenance-with-evidence`。
3. 预期 HTTP 200、decision 为 `accepted`、signal 为 `detection-rule-alert-triage-normal-verified`。

## 路径四：边界阻断

1. 提交未登记 scenarioKey / optionKey、只提交第一阶段，或在终止步骤后追加多余决策。
2. 预期返回 `detection-rule-alert-triage-boundary-blocked` 或 `path-incomplete` 对应的脱敏阻断结果。
3. 响应与事件日志不得包含原始未知 key、事件正文、规则表达式、查询、文件、主机、账号、IP、URL、凭据或 SIEM 配置。
