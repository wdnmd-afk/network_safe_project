# XXE 漏洞版

漏洞版模拟 XML 导入流程解析固定受控实体的风险。

安全边界：

- 只使用虚拟 XML 资源解析器。
- 只识别 `labSecret` 等固定教学实体。
- 虚拟实体结果来自硬编码教学映射。
- 不读取真实文件、不请求真实 URL、不解析真实外部实体。

预期观察：

- 正常 XML 返回 `xxe-safe-xml-imported`。
- 受控 XXE 样例返回 `xxe-internal-resource-exposed`。
- 事件日志阶段为 `attack`。
