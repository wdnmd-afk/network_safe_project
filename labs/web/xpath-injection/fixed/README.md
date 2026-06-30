# XPath 注入修复版规划

## 目标

修复版用于展示服务端固定查询模板、查询范围允许列表和文本值处理如何阻断 XPath 注入风险。

## 计划行为

- 只接受固定 `queryTemplate`。
- 只接受固定 `scope`。
- `keyword` 只作为文本值参与虚拟匹配。
- 固定受控样例进入修复版时应被阻断。
- 正常关键词仍可完成公开产品目录查询。
- 事件日志记录阻断原因和学习信号，不保存完整输入。

## 修复重点

- 不依赖前端隐藏字段或按钮。
- 不让客户端提交查询表达式。
- 查询模板由服务端固定选择。
- 文本值单独处理，不能改变查询结构。
- 日志和页面只展示安全摘要。

## 计划观察点

- 正常关键词请求应出现 `xpath-injection-safe-query-completed`。
- 固定受控样例应出现 `xpath-injection-controlled-sample-blocked`。
- 未知查询模板应出现 `xpath-injection-template-not-found`。
