# NoSQL 注入修复说明

## 漏洞根因

漏洞版风险来自把用户输入当作查询结构的一部分解释。攻击者一旦能影响字段、操作符或条件组合，查询语义就可能偏离原本业务目标。

## 修复策略

修复版采用服务端查询模板：

- 查询模式由服务端枚举。
- 查询字段由服务端允许列表决定。
- 用户输入只作为普通字符串值。
- 不接受客户端提交的查询对象。
- 在虚拟查询器前阻断对象型、数组型和疑似操作符型输入。

## 防御效果

同样的受控风险样例在修复版中不会改变查询结构。

预期信号：

- `nosql-injection-operator-blocked`
- `nosql-injection-schema-blocked`

## 日志差异

漏洞版：

- `phase = attack`
- `decision = accepted`
- `signal = nosql-injection-query-expanded`
- `risk_level = high`

修复版：

- `phase = defense`
- `decision = blocked`
- `signal = nosql-injection-operator-blocked`
- `risk_level = medium`

## 生产环境还需要

- 使用成熟 ORM / ODM 的安全查询接口。
- 为查询字段和操作符建立服务端允许列表。
- 严格校验输入类型。
- 限制返回字段和结果数量。
- 对异常查询行为做审计和告警。
- 对敏感数据做访问控制，而不是只依赖查询过滤。
