# XPath 注入 mock 资源规划

## 定位

本目录用于记录后续虚拟 XML 产品目录查询模拟器需要的教学数据和观察说明。

## 计划虚拟数据

后续后端 service 可维护内存数据集合，字段建议包括：

- `id`
- `name`
- `category`
- `visibility`
- `summary`

其中 `visibility` 只作为教学字段，允许取值：

- `public`
- `internal`

## 约束

- 不放置真实 XML 文件。
- 不读取仓库外文件。
- 不保存真实业务数据。
- 不保存真实凭据、token、Cookie 或外部目标信息。
- 不把 mock 数据设计成可复用的 XPath 表达式样例库。
