# SQL 注入攻击步骤

## 攻击方目标

攻击者希望通过商品搜索输入改变后端 SQL 条件，让本来不该返回的隐藏商品出现在结果中。

## 前置条件

- 攻击者能访问本机实验页面。
- 攻击者能控制搜索关键词。
- 后端漏洞版把关键词拼接进 SQL。

## 操作步骤

1. 打开 `/labs/web/sql-injection/vuln`。
2. 点击“填入正常关键词”，提交 `router`。
3. 观察只返回公开商品，信号为 `sql-injection-normal-search`。
4. 点击“填入攻击样例”。
5. 提交受控 payload：

```text
%' OR 1=1 #
```

6. 观察查询预览中 `OR 1=1` 改变了条件语义。
7. 观察隐藏商品被返回，信号为 `sql-injection-data-exposed`。
8. 查看后端控制台 `[LAB_EVENT]` 日志。
9. 查看 `lab_event_logs` 中的事件摘要。

## 成功信号

- 页面显示隐藏商品。
- 后端返回 `sql-injection-data-exposed`。
- 事件日志中 `phase = attack`、`decision = accepted`、`risk_level = critical`。

## 刻意限制

本实验不会演示：

- 删除、修改或插入数据。
- UNION 查询。
- 时间盲注。
- 文件读取。
- 外部目标探测。

这些能力不适合在个人学习平台中做成通用脚本。
