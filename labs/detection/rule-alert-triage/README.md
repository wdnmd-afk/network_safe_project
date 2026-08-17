# 固定检测规则匹配与告警研判

## 场景目标

使用六条固定脱敏事件，对比过宽、过窄和跨来源关联规则的误报、漏报、准确率与召回率，并完成两步告警研判决策。

固定案例为 `fixed-auth-process-alert-timeline`。事件只包含相对时间、虚构来源、分类、严重度、信号标签、脱敏摘要和教学基线；规则画像只登记固定 `matchedEventIds`，不包含或执行任何查询表达式。

当前 LT-024 实现处于 `in-progress`。只有共享数据测试、专项只读验证和根级门禁经授权执行并全部通过后，才会推进为 `ready`。

## 固定规则画像

- `broad-auth-failure-rule`：TP=1、FP=1、FN=3、准确率 50%、召回率 25%。
- `narrow-unsigned-process-rule`：TP=1、FP=0、FN=3、准确率 100%、召回率 25%。
- `correlated-auth-process-network-rule`：TP=4、FP=0、FN=0、准确率 100%、召回率 100%。

## 固定决策

- 第一阶段：`trust-broad-single-signal-rule`、`trust-narrow-single-signal-rule` 或 `correlate-multi-source-signals`。
- 第二阶段：`dismiss-correlated-alert-as-noise`、`escalate-correlated-alert-for-containment` 或 `close-known-maintenance-with-evidence`。
- 风险信号：`detection-rule-alert-triage-risk-accepted`。
- 防御信号：`detection-rule-alert-triage-defense-escalated`。
- 正常信号：`detection-rule-alert-triage-normal-verified`。

## 前置条件

- 本机前端与后端服务已启动。
- 使用本项目本机演示账号登录。
- 不需要真实日志、主机、SIEM、EDR、外部情报或查询引擎。

## 使用方式

1. 访问 `/labs/detection/rule-alert-triage/vuln`，观察单信号规则指标与关联告警误关闭路径。
2. 切换到 `/labs/detection/rule-alert-triage/fixed`，选择跨来源关联规则并升级固定告警。
3. 载入正常维护路径，确认已知维护事件可凭登记证据正常关闭。
4. 在实验详情或账户中心复盘统一事件日志的安全摘要。

## 安全边界

- 固定教学数据与平台运行时 `lab_event_logs` 完全分离。
- 页面和 API 不接受事件正文、规则表达式、查询、文件、主机、账号、IP、URL、凭据、SIEM 配置或自由文本。
- 未知 key 会被脱敏阻断，不回显原始输入，也不写入事件日志。
- 本实验不提供 `exploit.py`，不连接真实系统，也不执行隔离、封禁、规则部署或告警关闭。
